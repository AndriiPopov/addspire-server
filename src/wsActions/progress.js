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
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')

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
            let progress = new Progress({
                status: 'not started',
                owner: accountId,
                goal,
                admins: [accountId],
                name: goal.name,
            })
            let group
            if (!data.inGroup) {
                group = new Group({
                    admins: [accountId],
                    users: allUsers,
                })

                group.progresses = [progress._id.toString()]
                group.save()
            }

            progress.group = group ? group._id.toString() : data.inGroup
            progress.save()

            const newNotificationId = await getNotificationId()
            for (let user of allUsers) {
                let as = ''
                if (as === accountId) as = 'motivator'
                if (goal.users && goal.users.includes(user))
                    as = as + (as ? ', ' : '') + 'achiever'

                if (goal.experts && goal.experts.includes(user))
                    as = as + (as ? ', ' : '') + 'expert'

                if (goal.supporters && goal.supporters.includes(user))
                    as = as + (as ? ', ' : '') + 'supporter'

                await Account.updateOne(
                    { _id: user },
                    {
                        $push: {
                            progresses: progress._id.toString(),
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
                        let newNotificationId = await getNotificationId()
                        let milestone = progress.goal.milestones.find(
                            item => item.key === stage.milestoneId
                        )

                        let milestoneName = milestone
                            ? milestone.name
                            : 'milestone'

                        if (data.value) {
                            const act = stage.approvedBy.find(
                                act => act.accountId === data.accountId
                            )
                            if (!act) {
                                stage.approvedBy.push({
                                    accountId: data.accountId,
                                })
                            }
                            addNotification(progress, {
                                user: data.accountId,
                                code: 'approve milestone',
                                notId: newNotificationId,
                                details: {
                                    itemName: milestoneName,
                                    progressId: progress._id,
                                    progressName: progress.goal.name,
                                },
                            })
                        } else {
                            if (data.milestoneId !== 'start') {
                                stage.approvedBy = stage.approvedBy.filter(
                                    item => item.accountId !== data.accountId
                                )
                                addNotification(progress, {
                                    user: data.accountId,
                                    code: 'disapprove milestone',
                                    notId: newNotificationId,
                                    details: {
                                        itemName: milestoneName,
                                        progressId: progress._id,
                                        progressName: progress.goal.name,
                                    },
                                })
                            } else {
                                ws.send(
                                    JSON.stringify({
                                        messageCode: 'errorMessage',
                                        messageText:
                                            'Start milestone cannot be disapproved.',
                                    })
                                )
                                return
                            }
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
                        newNotificationId = await getNotificationId()
                        addNotification(progress, {
                            user: data.accountId,
                            code: 'finish progress',
                            notId: newNotificationId,
                            details: {
                                progressId: progress._id,
                                progressName: progress.goal.name,
                            },
                        })
                    }
                    // Pay and create transaction if unpaid
                    for (let stageIn of progress.stages) {
                        if (
                            stageIn.status !== 'paid' &&
                            stageIn.approvedBy.find(
                                item => item.accountId === progress.owner
                            ) &&
                            (stageIn.milestoneId !== 'start' ||
                                [progress.owner, ...progress.goal.users].reduce(
                                    (res, user) =>
                                        stageIn.approvedBy.find(
                                            item => item.accountId === user
                                        )
                                            ? res
                                            : false,
                                    true
                                ))
                        ) {
                            milestone = progress.goal.milestones.find(
                                item => item.key === stage.milestoneId
                            )

                            milestoneName = milestone
                                ? milestone.name
                                : 'milestone'

                            newNotificationId = await getNotificationId()
                            addNotification(progress, {
                                code: 'milestone finish',
                                notId: newNotificationId,
                                details: {
                                    progressId: progress._id,
                                    progressName: progress.goal.name,
                                    itemName: milestoneName,
                                },
                            })
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
                                            .select('transactions wallet __v')
                                            .exec()
                                        const beniciaries =
                                            reward.for.length > 0
                                                ? reward.for
                                                : progress.goal.users
                                        for (let reciever of beniciaries) {
                                            const worker =
                                                owner._id.toString() !==
                                                reciever.toString()
                                                    ? await Account.findById(
                                                          reciever
                                                      )
                                                          .select(
                                                              'transactions wallet __v'
                                                          )
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
                                                status: 'Confirmed',
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
                                            await owner.save()
                                            if (!ownerIsWorker)
                                                await worker.save()
                                            newNotificationId = await getNotificationId()
                                            addNotification(progress, {
                                                user: reciever,
                                                code: 'get reward',
                                                notId: newNotificationId,
                                                details: {
                                                    progressId: progress._id,
                                                    progressName:
                                                        progress.goal.name,
                                                    from: reward.owner,
                                                    reward: {
                                                        money: reward.money,
                                                        simple: reward.simple,
                                                        itemName:
                                                            reward.itemName,
                                                    },
                                                },
                                            })
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
                const finishStage = progress.stages.find(
                    stage => stage.milestoneId === 'finish'
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
                if (finishStage) {
                    const ownerIsReady = finishStage.approvedBy.find(
                        item => item.accountId === progress.owner
                    )
                    let workersAreReady = true
                    for (let stageWorker of progress.goal.users) {
                        if (
                            !finishStage.approvedBy.find(
                                item => item.accountId === stageWorker
                            )
                        )
                            workersAreReady = false
                    }
                    if (ownerIsReady && workersAreReady) {
                        progress.status = 'finished'
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
        const { accountId, progressId } = data
        const progress = await Progress.findById(progressId)
            .select(
                '__v owner worker goal.name goal.experts goal.supporters notifications'
            )
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
        progress.goal.experts.filter(item => item !== accountId)
        progress.goal.supporters.filter(item => item !== accountId)

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
            if (progress.owner === accountId) {
                const oldProgress = progress.toObject()
                progress.goal = {
                    ...progress.goal.toObject(),
                    ...data.value,
                }
                progress.name = progress.goal.name
                updateRewardIds(progress.goal)

                const allOldAccounts = [
                    ...new Set([
                        ...oldProgress.goal.experts,
                        ...oldProgress.goal.supporters,
                        ...oldProgress.goal.users,
                        oldProgress.owner,
                    ]),
                ]

                const allNewAccounts = [
                    ...new Set([
                        ...progress.goal.experts,
                        ...progress.goal.supporters,
                        ...progress.goal.users,
                        progress.owner,
                    ]),
                ]

                let droppedAccounts = allOldAccounts.filter(
                    x => !allNewAccounts.includes(x)
                )

                let addedAccounts = allNewAccounts.filter(
                    x => !allOldAccounts.includes(x)
                )

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
            const rewardsGroup = progress.goal.rewardsGroups.find(
                item => item.key === data.rewardKey
            )

            if (rewardsGroup) {
                let reward
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
                let reward = null
                rewardsGroup.rewards = rewardsGroup.rewards.filter(item => {
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
            .select('group goal name')
            .lean()
            .exec()

        if (progress) {
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
                            progress.owner,
                            ...(progress.goal.users || []),
                        ]),
                    ]
                    group.admins = progress.admins
                    group.users = allUsers
                    group.images = progress.goal.images
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
