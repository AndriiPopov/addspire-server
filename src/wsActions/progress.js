const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const { Transaction } = require('../models/transaction')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const findMessage = require('../utils/findMessage')
const { sendError, sendSuccess } = require('./confirm')
const { Post } = require('../models/post')
const updateRewardIds = require('../utils/updateRewardIds')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { updateStages } = require('../utils/updateStages')

module.exports.startProgress = async (data, ws) => {
    try {
        const { accountId, value } = data
        const goal = value
        if (goal && accountId) {
            updateRewardIds(goal)
            const allUsers = [...new Set([accountId, ...(goal.users || [])])]
            let progress = new Progress({
                status: 'not started',
                owner: accountId,
                goal: {
                    ...goal,
                    rewards: goal.rewards || [],
                },
                admins: [accountId],
                name: goal.name,
                followingAccounts: allUsers,
            })

            updateStages(progress)
            await progress.save()

            const newNotificationId = await getNotificationId()
            for (let user of allUsers) {
                let as = ''
                if (as === accountId) as = 'motivator'
                if (goal.users && goal.users.includes(user))
                    as = as + (as ? ', ' : '') + 'achiever'

                await Account.updateOne(
                    { _id: user },
                    {
                        $push: {
                            progresses: {
                                $each: [progress._id.toString()],
                                $position: 0,
                            },
                            followProgresses: {
                                $each: [progress._id.toString()],
                                $position: 0,
                            },
                            notifications: {
                                $each: [
                                    {
                                        user,
                                        code: 'start progress',
                                        notId: newNotificationId,
                                        details: {
                                            itemId: progress._id,
                                            itemName: progress.goal.name,
                                            as,
                                        },
                                    },
                                ],
                                $position: 0,
                                $slice: 20,
                            },
                            myNotifications: {
                                $each: [
                                    {
                                        user,
                                        code: 'start progress',
                                        notId: newNotificationId,
                                        details: {
                                            itemId: progress._id,
                                            itemName: progress.goal.name,
                                            as,
                                        },
                                    },
                                ],
                                $position: 0,
                                $slice: 100,
                            },
                        },
                    }
                )
            }

            sendSuccess(ws, 'progress created')
        } else sendError(ws, 'Bad data!')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.changeLikesProgress = async (data, ws) => {
    try {
        if (data.progressId && data.accountId) {
            if (data.add) {
                await Progress.updateOne(
                    { _id: data.progressId },
                    { $addToSet: { likes: data.accountId } },
                    { useFindAndModify: false }
                )
            } else {
                await Progress.updateOne(
                    { _id: data.progressId },
                    { $pull: { likes: data.accountId } },
                    { useFindAndModify: false }
                )
            }
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws)
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
        const progress = await Progress.findById(data.progressId)
        const { accountId } = data

        if (
            progress &&
            (data.accountId === progress.owner ||
                progress.goal.users.includes(data.accountId))
        ) {
            const stage = progress.stages.find(
                stage => stage.stageId === data.stageId
            )

            if (stage) {
                let newNotificationId = await getNotificationId()
                const not = {
                    user: data.accountId,

                    notId: newNotificationId,
                    details: {
                        stageId: stage.stageId,
                        year: stage.year,
                        month: stage.month,
                        week: stage.week,
                        day: stage.day,
                        progressId: progress._id,
                        progressName: progress.goal.name,
                    },
                    code: 'stage progress',
                }
                stage.approvedBy = stage.approvedBy.filter(
                    item => item.accountId !== data.accountId
                )
                stage.failBy = stage.failBy.filter(
                    item => item.accountId !== data.accountId
                )
                if (progress.owner === data.accountId) stage.dismissed = false
                switch (data.value) {
                    case 'complete':
                        stage.approvedBy.push({
                            accountId: data.accountId,
                        })
                        not.code = 'stage approve'
                        break
                    case 'fail':
                        stage.failBy.push({
                            accountId: data.accountId,
                        })
                        not.code = 'stage fail'
                        break
                    case 'dismissed':
                        if (progress.owner === data.accountId)
                            stage.dismissed = true
                        not.code = 'stage dismiss'
                        break
                    default:
                        break
                }
                addNotification(progress, not)

                // Pay and create transaction if unpaid

                if (
                    stage.status !== 'paid' &&
                    stage.approvedBy.find(
                        item => item.accountId === progress.owner
                    )
                ) {
                    newNotificationId = await getNotificationId()
                    addNotification(progress, {
                        code: 'stage complete',
                        notId: newNotificationId,
                        details: {
                            progressId: progress._id,
                            progressName: progress.goal.name,
                            stageId: stage.stageId,
                            year: stage.year,
                            month: stage.month,
                            week: stage.week,
                            day: stage.day,
                        },
                    })
                    stage.status = 'paid'

                    const rewards = progress.goal.rewards
                    stage.paid = rewards

                    if (rewards.length > 0) {
                        for (let reward of rewards) {
                            const owner = await Account.findById(reward.owner)
                                .select('transactions wallet __v')
                                .exec()
                            const beniciaries = progress.goal.users
                            for (let reciever of beniciaries) {
                                const worker =
                                    owner._id.toString() !== reciever.toString()
                                        ? await Account.findById(reciever)
                                              .select('transactions wallet __v')
                                              .exec()
                                        : owner
                                const ownerIsWorker =
                                    owner._id.toString() ===
                                    worker._id.toString()

                                let transaction = new Transaction({
                                    from: owner._id,
                                    to: worker._id,
                                    item: reward,
                                    progress: progress.goal.name,
                                    progressId: progress._id,
                                    status: 'not confirmed',
                                })
                                transaction.save()

                                owner.transactions.unshift(
                                    transaction._id.toString()
                                )

                                if (!ownerIsWorker) {
                                    worker.transactions.unshift(
                                        transaction._id.toString()
                                    )
                                }

                                if (reward.money) {
                                    const existingCurrency = worker.wallet.find(
                                        item => item.user === progress.owner
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
                                await owner.save()
                                if (!ownerIsWorker) await worker.save()
                                newNotificationId = await getNotificationId()
                                addNotification(progress, {
                                    user: reciever,
                                    code: 'get reward',
                                    notId: newNotificationId,
                                    details: {
                                        progressId: progress._id,
                                        progressName: progress.goal.name,
                                        from: reward.owner,
                                        reward: {
                                            money: reward.money,
                                            simple: reward.simple,
                                            itemName: reward.itemName,
                                        },
                                    },
                                })
                            }
                        }
                    }
                }

                await progress.save()

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
        sendError(ws)
    }
}

module.exports.leaveProgress = async (data, ws) => {
    try {
        const { accountId, progressId } = data
        const progress = await Progress.findById(progressId)
            .select('__v owner worker goal.name notifications')
            .exec()
        const account = await Account.findById(accountId)
            .select('__v progresses')
            .exec()
        if (account) {
            account.progresses = account.progresses.filter(
                item => item !== progressId
            )
            account.save()
        }

        if (accountId === progress.owner) progress.owner = ''
        else if (accountId === progress.worker) progress.worker = ''

        const newNotificationId = await getNotificationId()
        addNotification(progress, {
            user: accountId,
            code: 'leave progress',
            notId: newNotificationId,
            details: {
                progressId: progress._id,
                progressName: progress.goal.name,
            },
        })

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
            const progressObj = progress.toObject()
            if (progress.owner === accountId) {
                const oldProgress = progress.toObject()
                progress.goal = {
                    ...progress.goal.toObject(),
                    ...data.value,
                }
                progress.name = progress.goal.name
                updateRewardIds(progress.goal)

                const allOldAccounts = [
                    ...new Set([...oldProgress.goal.users, oldProgress.owner]),
                ]

                const allNewAccounts = [
                    ...new Set([...progress.goal.users, progress.owner]),
                ]

                let droppedAccounts = allOldAccounts.filter(
                    x => !allNewAccounts.includes(x)
                )

                let addedAccounts = allNewAccounts.filter(
                    x => !allOldAccounts.includes(x)
                )

                progress.followingAccounts = [
                    ...new Set([
                        ...progress.followingAccounts,
                        ...addedAccounts,
                    ]),
                ]
                const newNotificationId = await getNotificationId()
                addNotification(progress, {
                    user: accountId,
                    code: 'edit progress',
                    notId: newNotificationId,
                    details: {
                        progressId: progress._id,
                        progressName: progress.goal.name,
                        droppedAccounts,
                        addedAccounts,
                    },
                })

                for (let id of droppedAccounts) {
                    const account = await Account.findById(id)
                        .select('progresses notifications myNotifications __v')
                        .exec()
                    if (account) {
                        account.progresses = account.progresses.filter(
                            item => item !== progressId
                        )
                        const newNotificationId = await getNotificationId()
                        addNotification(
                            account,
                            {
                                user: accountId,
                                code: 'remove from progress',
                                notId: newNotificationId,
                                details: {
                                    progressId: progress._id,
                                    progressName: progress.goal.name,
                                    account: id,
                                },
                            },
                            true,
                            true
                        )
                        account.save()
                    }
                }

                for (let id of addedAccounts) {
                    const account = await Account.findById(id)
                        .select('progresses notifications myNotifications __v')
                        .exec()
                    if (account) {
                        account.progresses = [
                            ...new Set([...account.progresses, progressId]),
                        ]
                        const newNotificationId = await getNotificationId()
                        addNotification(
                            account,
                            {
                                user: accountId,
                                code: 'add to progress',
                                notId: newNotificationId,
                                details: {
                                    progressId: progress._id,
                                    progressName: progress.goal.name,
                                    account: id,
                                },
                            },
                            true,
                            true
                        )
                        account.save()
                    }
                }
                updateStages(progress, progressObj.goal)
                progress.markModified('goal.rewards')
                progress.markModified('goal.description')
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
        if (progress) {
            let reward
            if (data.reward.rewardId) {
                reward = progress.goal.rewards.find(
                    item => item.rewardId === data.reward.rewardId
                )
                if (reward) {
                    reward = Object.assign(reward, data.reward)
                }
            }
            if (!reward) {
                progress.goal.rewards.push({
                    ...data.reward,
                    owner: data.accountId,
                })
            }
            updateRewardIds(progress.goal)
            const newNotificationId = await getNotificationId()
            addNotification(progress, {
                user: data.reward.owner,
                code: 'add reward',
                notId: newNotificationId,
                details: {
                    for: data.reward.for,
                    progressId: progress._id,
                    progressName: progress.goal.name,
                    reward: {
                        simple: data.reward.simple,
                        money: data.reward.money,
                        itemName: data.reward.itemName,
                    },
                },
            })
            progress.markModified('goal.rewards')
            progress.save()
            ws.send(
                JSON.stringify({
                    messageCode: 'successMessage',
                    messageText: 'Changes are saved',
                })
            )
            return
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
            let reward = null
            progress.goal.rewards = progress.goal.rewards.filter(item => {
                if (item.rewardId !== data.rewardId) {
                    return true
                } else {
                    reward = item
                    return false
                }
            })
            updateRewardIds(progress.goal)
            const newNotificationId = await getNotificationId()
            addNotification(progress, {
                user: reward.owner,
                code: 'delete reward',
                notId: newNotificationId,
                details: {
                    for: reward.for,
                    progressId: progress._id,
                    progressName: progress.goal.name,
                    reward: {
                        simple: reward.simple,
                        money: reward.money,
                        itemName: reward.itemName,
                    },
                },
            })
            progress.markModified('goal.rewards')
            progress.save()
            ws.send(
                JSON.stringify({
                    messageCode: 'successMessage',
                    messageText: 'Changes are saved',
                })
            )
            return
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
