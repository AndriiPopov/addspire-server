const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const { Transaction } = require('../models/transaction')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const findMessage = require('../utils/findMessage')
const { sendError, sendSuccess } = require('./confirm')
const { Post } = require('../models/post')
const { Reward } = require('../models/reward')
const { Activity } = require('../models/activity')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { updateStages } = require('../utils/updateStages')

module.exports.saveResource = async (data, ws) => {
    try {
        const { accountId, value, type, structureId } = data

        if (value && accountId) {
            const allUsers = [...new Set([accountId, ...(value.users || [])])]
            const model =
                type === 'goal'
                    ? Progress
                    : type === 'reward'
                    ? Reward
                    : Activity
            const accountProp =
                type === 'goal'
                    ? 'progresses'
                    : type === 'reward'
                    ? 'rewards'
                    : 'activities'
            const followProp =
                type === 'goal'
                    ? 'followProgresses'
                    : type === 'reward'
                    ? 'followRewards'
                    : 'followActivities'
            if (!value._id) {
                let resource = new model({
                    owner: accountId,
                    ...value,

                    followingAccounts: allUsers,
                })
                if (type === 'activity') updateStages(resource)
                if (type === 'goal') resource.dueDate = new Date(value.dueDate)

                await resource.save()

                const newNotificationId = await getNotificationId()
                for (let user of allUsers) {
                    let as = ''

                    await Account.updateOne(
                        { _id: user },
                        {
                            $push: {
                                [accountProp]: {
                                    $each: [resource._id.toString()],
                                    $position: 0,
                                },
                                [followProp]: {
                                    $each: [resource._id.toString()],
                                    $position: 0,
                                },
                                notifications: {
                                    $each: [
                                        {
                                            user,
                                            code: 'start progress',
                                            notId: newNotificationId,
                                            details: {
                                                itemId: resource._id,
                                                itemName: resource.name,
                                                itemType: type,
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
                                                itemId: resource._id,
                                                itemName: resource.name,
                                                itemType: type,
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

                sendSuccess(ws, type + ' created')
                if (data.goToResource)
                    ws.send(
                        JSON.stringify({
                            messageCode: 'goTo',
                            messageText:
                                '/' +
                                (type === 'goal'
                                    ? 'goals'
                                    : type === 'reward'
                                    ? 'rewards'
                                    : 'activities') +
                                '/' +
                                resource._id,
                        })
                    )
                if (structureId) {
                    ws.send(
                        JSON.stringify({
                            messageCode: 'addToStructure',
                            accountId,
                            structureId,
                            resourceId: resource._id,
                        })
                    )
                }
            } else {
                let resource = await model.findById(value._id)
                if (resource) {
                    const resourceObj = resource.toObject()
                    const oldResource = resource.toObject()
                    resource = Object.assign(resource, data.value)
                    if (type === 'goal')
                        resource.dueDate = new Date(value.dueDate)
                    const allOldAccounts = [
                        ...new Set([
                            ...(oldResource.users || []),
                            oldResource.owner,
                        ]),
                    ]

                    const allNewAccounts = [
                        ...new Set([...(resource.users || []), resource.owner]),
                    ]

                    let droppedAccounts = allOldAccounts.filter(
                        x => !allNewAccounts.includes(x)
                    )

                    let addedAccounts = allNewAccounts.filter(
                        x => !allOldAccounts.includes(x)
                    )

                    resource.followingAccounts = [
                        ...new Set([
                            ...resource.followingAccounts,
                            ...addedAccounts,
                        ]),
                    ]
                    const newNotificationId = await getNotificationId()
                    addNotification(resource, {
                        user: accountId,
                        code: 'edit progress',
                        notId: newNotificationId,
                        details: {
                            progressId: resource._id,
                            progressName: resource.name,
                            droppedAccounts,
                            addedAccounts,
                            type,
                        },
                    })

                    for (let id of droppedAccounts) {
                        const account = await Account.findById(id)
                            .select(
                                'progresses rewards activities notifications myNotifications __v'
                            )
                            .exec()
                        if (account) {
                            account[accountProp] = account[accountProp].filter(
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
                                        progressId: resource._id,
                                        progressName: resource.name,
                                        account: id,
                                        type,
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
                            .select(
                                'progresses reards activitiesnotifications myNotifications __v'
                            )
                            .exec()
                        if (account) {
                            account[accountProp] = [
                                ...new Set([
                                    ...account[accountProp],
                                    progressId,
                                ]),
                            ]
                            const newNotificationId = await getNotificationId()
                            addNotification(
                                account,
                                {
                                    user: accountId,
                                    code: 'add to progress',
                                    notId: newNotificationId,
                                    details: {
                                        progressId: resource._id,
                                        progressName: resource.name,
                                        account: id,
                                        type,
                                    },
                                },
                                true,
                                true
                            )
                            account.save()
                        }
                    }
                    if (type === 'activity') updateStages(resource, resourceObj)
                    resource.markModified('rewards')
                    resource.markModified('description')
                    resource.markModified('position')
                    resource.save()
                    sendSuccess(ws)
                    return
                }
            }
        } else sendError(ws, 'Bad data!')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.changeLikesResource = async (data, ws) => {
    try {
        if (data.resourceId && data.accountId && data.type) {
            const model =
                data.type === 'goal'
                    ? Progress
                    : data.type === 'reward'
                    ? Reward
                    : Activity
            if (data.add) {
                await model.updateOne(
                    { _id: data.resourceId },
                    { $addToSet: { likes: data.accountId } },
                    { useFindAndModify: false }
                )
            } else {
                await model.updateOne(
                    { _id: data.resourceId },
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

module.exports.leaveResource = async (data, ws) => {
    try {
        const { accountId, resourceId, type } = data
        const model =
            type === 'goal' ? Progress : type === 'activity' ? Activity : null
        const accountProp =
            type === 'goal'
                ? 'progresses'
                : type === 'reward'
                ? 'rewards'
                : 'activities'
        if (!model) return
        const resource = await model
            .findById(resourceId)
            .select('__v owner worker name notifications')
            .exec()
        const account = await Account.findById(resource.owner)
            .select('__v progresses activities')
            .exec()
        if (account) {
            account[accountProp] = account[accountProp].filter(
                item => item !== resourceId
            )
            account.save()
        }
        if (resource) {
            if (accountId === resource.owner) resource.owner = ''
            else if (accountId === resource.worker) resource.worker = ''

            const newNotificationId = await getNotificationId()
            addNotification(resource, {
                user: accountId,
                code: 'leave progress',
                notId: newNotificationId,
                details: {
                    progressId: resource._id,
                    progressName: resource.name,
                },
            })

            resource.save()
        }
        sendSuccess(ws)
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

module.exports.deleteResource = async (data, ws) => {
    try {
        const { accountId, resourceId, type } = data
        const model =
            type === 'goal' ? Progress : type === 'reward' ? Reward : Activity
        const accountProp =
            type === 'goal'
                ? 'progresses'
                : type === 'reward'
                ? 'rewards'
                : 'activities'
        if (!model) return
        const resource = await model.findOneAndDelete(
            { _id: resourceId },
            {
                projection: {
                    owner: 1,
                    users: 1,
                    name: 1,
                    followingAccounts: 1,
                },
            }
        )

        if (resource) {
            await Account.updateMany(
                {
                    _id: {
                        $in: [
                            resource.owner,
                            ...(resource.users || []),
                            ...resource.followingAccounts,
                        ],
                    },
                },
                {
                    $pull: {
                        followProgresses: resourceId,
                        followActivities: resourceId,
                        followRewards: resourceId,
                        rewards: resourceId,
                        activities: resourceId,
                        progresses: resourceId,
                    },
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: resource.owner,
                                    code: 'delete progress',
                                },
                            ],
                            $position: 0,
                            $slice: 20,
                        },
                    },
                },
                { useFindAndModify: false }
            )
        }

        sendSuccess(ws)
        ws.send(
            JSON.stringify({
                messageCode: 'redirectToAccount',
            })
        )
        return
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.changeResourceStatus = async (data, ws) => {
    try {
        await Progress.findByIdAndUpdate(
            { _id: data.resourceId },
            {
                status: data.status,
                finishDate: new Date(),
            },
            { useFindAndModify: false }
        )

        sendSuccess(ws)

        return
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}
