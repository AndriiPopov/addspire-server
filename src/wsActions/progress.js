const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const { Transaction } = require('../models/transaction')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const diffpatcher = require('jsondiffpatch/dist/jsondiffpatch.umd.js').create({
    propertyFilter: (name, context) => name !== '__patch__',
})

const findMessage = require('../utils/findMessage')
const { sendError, sendSuccess } = require('./confirm')
const { Post } = require('../models/post')
const updateRewardIds = require('../utils/updateRewardIds')
const { Group } = require('../models/group')

module.exports.startProgress = async (data, ws) => {
    try {
        const { accountId, value } = data
        const goal = value
        if (goal && accountId) {
            updateRewardIds(goal)
            const allUsers = [
                ...new Set([
                    ...(goal.experts || []),
                    ...(goal.supporters || []),
                    accountId,
                    ...(goal.users || []),
                ]),
            ]
            let group = new Group({
                admins: [accountId],
                users: allUsers,
            })

            let progress = new Progress({
                status: 'not started',
                owner: accountId,
                goal,
                stages: [
                    {
                        milestoneId: 'start',
                        approvedBy: [
                            {
                                accountId,
                            },
                        ],
                    },
                ],
                admins: [accountId],
                group: group._id.toString(),
            })

            group.progresses = [progress._id.toString()]
            progress.save()
            group.save()

            await Account.updateMany(
                { _id: { $in: allUsers } },
                {
                    $push: { progresses: progress._id.toString() },
                }
            )

            sendSuccess(ws, 'progress created')
        } else sendError(ws, 'Bad data!')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.requestProgress = async (data, ws) => {
    try {
        ws.progressId = data.progressId
    } catch (ex) {
        sendError(ws)
    }
}

module.exports.changeStage = async (data, ws) => {
    try {
        const progress = await Progress.findById(data.progressId).exec()
        const { accountId } = data

        if (
            progress &&
            (data.accountId === progress.owner ||
                progress.goal.users.includes(data.accountId) ||
                progress.goal.experts.includes(data.accountId))
        ) {
            if (data.milestoneId) {
                if (
                    data.milestoneId === 'start' ||
                    progress.status === 'in progress'
                ) {
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
                                    for (let reward of rewards) {
                                        const owner = await Account.findById(
                                            reward.owner
                                        )
                                            .select('transactions wallet')
                                            .exec()
                                        const beniciaries =
                                            reward.for.length > 0
                                                ? reward.for
                                                : goal.users
                                        for (let reciever of beniciaries) {
                                            const worker =
                                                owner._id !== reciever
                                                    ? await Account.findById(
                                                          reciever
                                                      )
                                                          .select(
                                                              'transactions wallet'
                                                          )
                                                          .exec()
                                                    : owner
                                            let transaction = new Transaction({
                                                from: owner._id,
                                                to: worker._id,
                                                item: {
                                                    simple: reward.simple,
                                                    itemName: reward.itemName,
                                                    itemDescription:
                                                        reward.itemDescription,
                                                    itemImages:
                                                        reward.itemImages,
                                                },
                                                progress: progress._id,
                                                amount: reward.money,
                                                status: 'Confirmed',
                                            })
                                            transaction = transaction.save()
                                            if (owner.transactions)
                                                owner.transactions.unshift(
                                                    transaction._id.toString()
                                                )
                                            else
                                                owner.transactions = [
                                                    transaction._id.toString(),
                                                ]
                                            if (progress.owner !== reciever) {
                                                if (worker.transactions)
                                                    worker.transactions.unshift(
                                                        transaction._id.toString()
                                                    )
                                                else
                                                    worker.transactions = [
                                                        transaction._id.toString(),
                                                    ]
                                            }
                                            if (!worker.wallet)
                                                worker.wallet = []
                                            if (reward.money) {
                                                const existingCurrency = worker.wallet.find(
                                                    item =>
                                                        item.user ===
                                                        progress.owner
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
                                            owner.save()
                                            if (progress.owner !== reciever)
                                                worker.save()
                                        }
                                    }
                                }
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
                    let workersAreReady = true
                    for (let stageWorker of progress.goal.users) {
                        if (
                            !startStage.approvedBy.find(
                                item => item.accountId === stageWorker
                            )
                        )
                            workersAreReady = false
                    }
                    if (ownerIsReady && workersAreReady) {
                        progress.status = 'in progress'
                    } else {
                        progress.status = 'not started'
                    }
                }

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
        const { accountId, progressId } = data
        const progress = await Progress.findById(data.progressId)
        if (progress) {
            if (progress.owner === accountId) {
                const oldProgress = progress.toObject()
                progress.goal = {
                    ...progress.goal.toObject(),
                    ...data.value,
                }
                updateRewardIds(progress.goal)

                const allOldAccounts = [
                    ...new Set([
                        ...oldProgress.goal.experts,
                        ...oldProgress.goal.supporters,
                        ...oldProgress.goal.users,
                    ]),
                ]

                const allNewAccounts = [
                    ...new Set([
                        ...progress.goal.experts,
                        ...progress.goal.supporters,
                        ...progress.goal.users,
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

module.exports.saveReward = async (data, ws) => {
    try {
        const progress = await Progress.findById(data.progressId)
        console.log('here0')
        if (progress) {
            const rewardsGroup = progress.goal.rewardsGroups.find(
                item => item.key === data.rewardKey
            )
            console.log('here')

            if (rewardsGroup) {
                console.log('here2')
                let reward
                console.log(reward)
                console.log(data.reward)
                if (data.reward.rewardId) {
                    reward = rewardsGroup.rewards.find(
                        item => item.rewardId === data.reward.rewardId
                    )
                    if (reward) {
                        reward = Object.assign(reward, data.reward)
                    }
                }
                if (!reward) {
                    rewardsGroup.rewards.push({
                        ...data.reward,
                        owner: data.accountId,
                    })
                }
                updateRewardIds(progress.goal)
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

module.exports.deleteReward = async (data, ws) => {
    try {
        const progress = await Progress.findById(data.progressId)
        if (progress) {
            const rewardsGroup = progress.goal.rewardsGroups.find(
                item => item.key === data.rewardKey
            )

            if (rewardsGroup) {
                rewardsGroup.rewards = rewardsGroup.rewards.filter(
                    item => item.rewardId !== data.rewardId
                )
                updateRewardIds(progress.goal)
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

module.exports.createGroup = async (data, ws) => {
    try {
        const progress = await Progress.findById(data.progressId)
            .select('group goal')
            .lean()
            .exec()

        if (progress && account) {
            const group = await Group.findById(progress.group)
            if (group) {
                if (group.active) {
                    ws.send(
                        JSON.stringify({
                            messageCode: 'successMessage',
                            messageText: 'The progress is already in a group',
                        })
                    )
                    return
                } else {
                    const allUsers = [
                        ...new Set([
                            ...(progress.goal.experts || []),
                            ...(progress.goal.supporters || []),
                            data.accountId,
                            ...(progress.goal.users || []),
                        ]),
                    ]
                    group.admins = progress.admins
                    group.users = allUsers
                    group.progresses = [progress._id.toString()]
                    group.description = progress.goal.description
                    group.name = progress.goal.name
                    group.active = true
                    group.save()

                    await Account.updateMany(
                        { _id: { $in: allUsers } },
                        {
                            $push: { groups: group._id.toString() },
                        }
                    )

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
