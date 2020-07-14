const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const { Transaction } = require('../models/transaction')

const diffpatcher = require('jsondiffpatch/dist/jsondiffpatch.umd.js').create({
    propertyFilter: (name, context) => name !== '__patch__',
})

const { sendError } = require('./error')
const findMessage = require('../utils/findMessage')

module.exports.requestProgress = async (data, ws) => {
    try {
        ws.progressId = data.progressId
    } catch (ex) {
        sendError(ws)
    }
}

module.exports.sendMessage = async (data, ws) => {
    try {
        if (ws.progressId === data.progressId) {
            const progress = await Progress.findById(ws.progressId)
                .select(
                    '__v owner worker currentId messages goal.experts goal.supporters'
                )
                .exec()

            if (
                data.accountId === progress.owner ||
                data.accountId === progress.worker ||
                progress.goal.experts.includes(data.accountId) ||
                progress.goal.supporters.includes(data.accountId)
            ) {
                const oldProgress = progress.toObject()
                if (!data.editedMessage && !data.replyToMessage) {
                    progress.messages.push({
                        author: data.accountId,
                        text: data.imageUrl || data.messageValue,
                        action: data.imageUrl ? 'image' : 'message',
                        messageId: progress.currentId,
                    })
                    progress.currentId = progress.currentId + 1
                } else if (data.editedMessage) {
                    const message = findMessage(
                        progress.messages,
                        data.editedMessage
                    )

                    if (message) {
                        message.text = data.imageUrl || data.messageValue
                        message.action = data.imageUrl ? 'image' : 'message'
                        message.editedDate = Date.now()
                    }
                } else if (data.replyToMessage) {
                    const message = findMessage(
                        progress.messages,
                        data.replyToMessage
                    )

                    if (message) {
                        message.replies.push({
                            author: data.accountId,
                            text: data.imageUrl || data.messageValue,
                            action: data.imageUrl ? 'image' : 'message',
                            messageId: progress.currentId,
                            image: '',
                            date: Date.now(),
                            editedDate: Date.now(),
                            likes: [],
                            dislikes: [],
                            replies: [],
                        })
                        progress.currentId = progress.currentId + 1
                    }
                }
                const newProgress = progress.toObject()
                delete newProgress.patch
                delete oldProgress.patch
                progress.patch = diffpatcher.diff(oldProgress, newProgress)
                progress.markModified('messages')
                progress.markModified('patch')

                progress.save()
                ws.send(
                    JSON.stringify({
                        messageCode: 'messageSaved',
                    })
                )
            } else {
                ws.send(
                    JSON.stringify({
                        messageCode: 'exit',
                    })
                )
            }
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.changeLikesMessage = async (data, ws) => {
    try {
        if (ws.progressId === data.progressId) {
            const progress = await Progress.findById(ws.progressId)
                .select(
                    '__v owner worker currentId messages goal.experts goal.supporters'
                )
                .exec()
            const { accountId } = data

            if (
                data.accountId === progress.owner ||
                data.accountId === progress.worker ||
                progress.goal.experts.includes(data.accountId) ||
                progress.goal.supporters.includes(data.accountId)
            ) {
                if (data.messageId) {
                    const message = findMessage(
                        progress.messages,
                        data.messageId
                    )

                    if (message) {
                        const oldProgress = progress.toObject()
                        switch (data.messageCode) {
                            case 'likeMessage':
                                if (message.likes.indexOf(accountId) === -1)
                                    message.likes.push(accountId)
                                message.dislikes = message.dislikes.filter(
                                    item => item !== accountId
                                )
                                break
                            case 'removeLikeMessage':
                                message.likes = message.likes.filter(
                                    item => item !== accountId
                                )
                                message.dislikes = message.dislikes.filter(
                                    item => item !== accountId
                                )
                                break
                            case 'dislikeMessage':
                                if (message.dislikes.indexOf(accountId) === -1)
                                    message.dislikes.push(accountId)
                                message.likes = message.likes.filter(
                                    item => item !== accountId
                                )
                                break
                            case 'removeDislikeMessage':
                                message.likes = message.likes.filter(
                                    item => item !== accountId
                                )
                                message.dislikes = message.dislikes.filter(
                                    item => item !== accountId
                                )
                                break
                        }

                        const newProgress = progress.toObject()
                        delete newProgress.patch
                        delete oldProgress.patch
                        progress.patch = diffpatcher.diff(
                            oldProgress,
                            newProgress
                        )
                        progress.markModified('messages')
                        progress.markModified('patch')

                        progress.save()
                    }
                }
            }
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.changeStage = async (data, ws) => {
    try {
        if (ws.progressId === data.progressId) {
            const progress = await (await Progress.findById(ws.progressId))
                .isSelected('-patch')
                .exec()
            const { accountId } = data

            if (
                data.accountId === progress.owner ||
                data.accountId === progress.worker ||
                progress.goal.experts.includes(data.accountId) ||
                progress.goal.supporters.includes(data.accountId)
            ) {
                if (data.milestoneId) {
                    if (
                        data.milestoneId !== 'start' &&
                        progress.status !== 'in progress'
                    )
                        return
                    const oldProgress = progress.toObject()
                    let stage = progress.stages.find(
                        stage => stage.milestoneId === data.milestoneId
                    )
                    if (!stage) {
                        stage = {
                            milestoneId: data.milestoneId,
                            approvedBy: [{ accountId: data.accountId }],
                        }
                        progress.stages.push(stage)
                    }
                    if (stage) {
                        if (data.value) {
                            const act = stage.approvedBy.find(
                                act => act.accountId === data.accountId
                            )
                            if (!act) {
                                stage.approvedBy.push({
                                    accountId: data.accountId,
                                })
                            }
                        } else {
                            if (data.milestoneId !== 'start')
                                stage.approvedBy = stage.approvedBy.filter(
                                    item => item.accountId !== data.accountId
                                )
                        }
                    }

                    const finishStage = progress.stages.find(
                        stage => stage.milestoneId === 'finish'
                    )
                    if (
                        finishStage &&
                        finishStage.approvedBy.find(
                            item => item.accountId === progress.owner
                        ) &&
                        finishStage.status !== 'paid'
                    ) {
                        for (let stageIn of progress.stages) {
                            if (
                                !stageIn.approvedBy.find(
                                    item => item.accountId === progress.owner
                                )
                            )
                                stageIn.approvedBy.push({
                                    accountId: progress.owner,
                                })
                        }
                    }
                    // Pay and create transaction if unpaid
                    for (let stageIn of progress.stages) {
                        if (
                            stageIn.status !== 'paid' &&
                            stageIn.approvedBy.find(
                                item => item.accountId === progress.owner
                            ) &&
                            (stageIn.milestoneId !== 'start' ||
                                stageIn.approvedBy.find(
                                    item => item.accountId === progress.worker
                                ))
                        ) {
                            stageIn.status = 'paid'
                            const rewardsGroup = progress.goal.rewardsGroups.find(
                                item => item.key === stageIn.milestoneId
                            )

                            if (rewardsGroup) {
                                const rewards = rewardsGroup.rewards
                                stageIn.paid = rewards

                                if (rewards.length > 0) {
                                    const owner = await Account.findById(
                                        progress.owner
                                    )
                                        .select('transactions wallet')
                                        .exec()

                                    const worker =
                                        progress.owner !== progress.worker
                                            ? await Account.findById(
                                                  progress.worker
                                              )
                                                  .select('transactions wallet')
                                                  .exec()
                                            : owner
                                    for (let reward of rewards) {
                                        let transaction = new Transaction({
                                            from: progress.owner,
                                            to: progress.worker,
                                            item: {
                                                simple: reward.simple,
                                                itemName: reward.itemName,
                                                itemDescription:
                                                    reward.itemDescription,
                                                itemImages: reward.itemImages,
                                            },
                                            progress: progress._id,
                                            amount: reward.money,
                                            status: 'Confirmed',
                                        })
                                        transaction = await transaction.save()
                                        if (owner.transactions)
                                            owner.transactions.unshift(
                                                transaction._id.toString()
                                            )
                                        else
                                            owner.transactions = [
                                                transaction._id.toString(),
                                            ]
                                        if (
                                            progress.owner !== progress.worker
                                        ) {
                                            if (worker.transactions)
                                                worker.transactions.unshift(
                                                    transaction._id.toString()
                                                )
                                            else
                                                worker.transactions = [
                                                    transaction._id.toString(),
                                                ]
                                        }
                                        if (!worker.wallet) worker.wallet = []
                                        if (reward.money) {
                                            const existingCurrency = worker.wallet.find(
                                                item =>
                                                    item.user === progress.owner
                                            )
                                            if (existingCurrency) {
                                                existingCurrency.amount =
                                                    existingCurrency.amount +
                                                    reward.money
                                            } else {
                                                worker.wallet.push({
                                                    user: progress.owner,
                                                    amount: reward.money,
                                                })
                                            }
                                        }
                                    }
                                    owner.save()
                                    if (progress.owner !== progress.worker)
                                        worker.save()
                                }
                            }
                        }
                    }

                    const startStage = progress.stages.find(
                        stage => stage.milestoneId === 'start'
                    )
                    if (!startStage) progress.status = 'not started'
                    else {
                        const ownerIsReady = startStage.approvedBy.find(
                            item => item.accountId === progress.owner
                        )
                        const workerIsReady = startStage.approvedBy.find(
                            item => item.accountId === progress.worker
                        )
                        if (ownerIsReady && workerIsReady) {
                            progress.status = 'in progress'
                        } else {
                            progress.status = 'not started'
                        }
                    }

                    const newProgress = progress.toObject()
                    delete newProgress.patch
                    delete oldProgress.patch
                    progress.patch = diffpatcher.diff(oldProgress, newProgress)
                    progress.markModified('stages')
                    progress.markModified('patch')

                    progress.save()
                    ws.send(
                        JSON.stringify({
                            messageCode: 'successMessage',
                            messageText: 'Changes are saved',
                        })
                    )
                    return
                }
            }
        }
        ws.send(
            JSON.stringify({
                messageCode: 'errorMessage',
                messageText: 'Something failed.',
            })
        )
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.leaveProgress = async (data, ws) => {
    try {
        if (ws.progressId === data.progressId) {
            const { accountId, progressId } = data
            const progress = await Progress.findById(ws.progressId)
                .select('__v owner worker goal.experts goal.supporters')
                .exec()
            const account = await Account.findById(accountId)
                .select('progresses')
                .exec()
            if (account) {
                account.progresses = account.progresses.filter(
                    item => item !== progressId
                )
                account.save()
            }
            const oldProgress = progress.toObject()
            if (accountId === progress.owner) progress.owner = ''
            else if (accountId === progress.worker) progress.worker = ''
            progress.goal.experts.filter(item => item !== accountId)
            progress.goal.supporters.filter(item => item !== accountId)

            const newProgress = progress.toObject()
            delete newProgress.patch
            delete oldProgress.patch
            progress.patch = diffpatcher.diff(oldProgress, newProgress)
            progress.markModified('patch')

            progress.save()
            ws.send(
                JSON.stringify({
                    messageCode: 'successMessage',
                    messageText: 'You have left the progress',
                })
            )
            ws.send(
                JSON.stringify({
                    messageCode: 'redirectToProgresses',
                })
            )
            return
        }
        ws.send(
            JSON.stringify({
                messageCode: 'errorMessage',
                messageText: 'Something failed.',
            })
        )
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.getFriendsData = async (data, ws) => {
    try {
        if (ws.progressId === data.progressId) {
            friendsData = await Account.find({
                _id: { $in: data.accountIds },
            })
                .select('name image')
                .lean()
                .exec()
            ws.send(
                JSON.stringify({
                    messageCode: 'friendsData',
                    friendsData,
                })
            )
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.editGoalInProgress = async (data, ws) => {
    try {
        if (ws.progressId === data.progressId) {
            const { accountId, progressId } = data
            const progress = await Progress.findById(ws.progressId)
                .select('__v owner worker goal')
                .exec()
            if (progress) {
                if (progress.owner === accountId) {
                    const oldProgress = progress.toObject()
                    progress.goal = {
                        ...progress.goal.toObject(),
                        ...data.value,
                    }

                    const allOldAccounts = [
                        ...new Set([
                            ...oldProgress.goal.experts,
                            ...oldProgress.goal.supporters,
                        ]),
                    ]

                    const allNewAccounts = [
                        ...new Set([
                            ...progress.goal.experts,
                            ...progress.goal.supporters,
                        ]),
                    ]

                    let droppedAccounts = allOldAccounts.filter(
                        x => !allNewAccounts.includes(x)
                    )

                    let addedAccounts = allNewAccounts.filter(
                        x => !allOldAccounts.includes(x)
                    )

                    for (let id of droppedAccounts) {
                        const account = await Account.findById(id)
                            .select('progresses')
                            .exec()
                        if (account) {
                            account.progresses = account.progresses.filter(
                                item => item !== progressId
                            )
                            account.save()
                        }
                    }

                    for (let id of addedAccounts) {
                        const account = await Account.findById(id)
                            .select('progresses')
                            .exec()
                        if (account) {
                            account.progresses = [
                                ...new Set([...account.progresses, progressId]),
                            ]
                            account.save()
                        }
                    }

                    const newProgress = progress.toObject()
                    delete newProgress.patch
                    delete oldProgress.patch
                    progress.patch = diffpatcher.diff(oldProgress, newProgress)
                    progress.markModified('patch')

                    progress.save()
                    ws.send(
                        JSON.stringify({
                            messageCode: 'successMessage',
                            messageText: 'Changes are saved',
                        })
                    )
                    return
                }
            }
        }
        ws.send(
            JSON.stringify({
                messageCode: 'errorMessage',
                messageText: 'Something failed...',
            })
        )
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}
