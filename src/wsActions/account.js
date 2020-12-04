const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
Joi.objectId = require('joi-objectid')(Joi)
const { JoiLength } = require('../constants/fieldLength')

const getAccount = require('../utils/getAccount')
const { sendSuccess, sendError } = require('./confirm')
const { User } = require('../models/user')
const { getNotificationId } = require('../models/system')

const { Progress } = require('../models/progress')
const { Reward } = require('../models/reward')
const { Activity } = require('../models/activity')

const editAccountSchema = Joi.object({
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),

    name: Joi.string()
        .max(JoiLength.name)
        .required(),
}).unknown(true)

module.exports.editAccount = async (data, ws) => {
    try {
        const { error } = editAccountSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }
        const newNotificationId = await getNotificationId()
        await Account.findOneAndUpdate(
            { _id: data.accountId },
            {
                $set: { name: data.name },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: data.accountId,
                                code: 'change name',
                                notId: newNotificationId,
                            },
                        ],
                        $position: 0,
                        $slice: 20,
                    },
                },
            },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}

const addRecentSchema = Joi.object({
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),
    resourceId: Joi.objectId().required(),
    type: Joi.string().required(),
}).unknown(true)

module.exports.addRecent = async (data, ws) => {
    try {
        const { error } = addRecentSchema.validate(data)
        if (error) {
            return
        }

        await Account.findOneAndUpdate(
            { _id: data.accountId },
            {
                $pull: {
                    recent: { resourceId: data.resourceId },
                },
            },
            { useFindAndModify: false }
        )
        await Account.findOneAndUpdate(
            { _id: data.accountId },
            {
                $push: {
                    recentProgresses: {
                        $each: [
                            {
                                resourceId: data.progressId,
                                resourceType: data.type,
                            },
                        ],
                        $position: 0,
                        $slice: 20,
                    },
                },
            },
            { useFindAndModify: false }
        )

        // sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        // sendError(ws, 'Something failed.')
    }
}

const deleteAccountSchema = Joi.object({
    accountId: Joi.string().required(),
    messageCode: Joi.string().required(),
})

module.exports.deleteAccount = async (data, ws) => {
    try {
        const { error } = deleteAccountSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }

        let account = await Account.findById(data.accountId)
            .select(
                'friends progresses followAccounts followingAccounts followProgresses __v'
            )
            .lean()
        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }

        await Account.updateMany(
            {
                _id: {
                    $in: [
                        ...account.friends.map(friend => friend.friend),
                        ...account.followAccounts,
                        ...account.followingAccounts,
                    ],
                },
            },
            {
                $pull: {
                    followAccounts: data.accountId,
                    followingAccounts: data.accountId,
                    friends: { friend: data.accountId },
                },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: account._id,
                                code: 'delete account',
                            },
                        ],
                        $position: 0,
                        $slice: 20,
                    },
                },
            },
            { useFindAndModify: false }
        )

        await Progress.updateMany(
            {
                _id: {
                    $in: [...account.progresses, ...account.followProgresses],
                },
            },
            {
                $pull: {
                    followingAccounts: data.accountId,
                    users: data.accountId,
                },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: account._id,
                                code: 'delete account',
                            },
                        ],
                        $position: 0,
                        $slice: 20,
                    },
                },
            },
            { useFindAndModify: false }
        )

        await Account.findByIdAndDelete(account._id).exec()
        await User.findByIdAndDelete(ws.user).exec()

        sendSuccess(ws)
        ws.send(
            JSON.stringify({
                messageCode: 'logout',
            })
        )
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

const followAccountSchema = Joi.object({
    accountId: Joi.string().required(),
    accountFollow: Joi.string().required(),
}).unknown(true)

module.exports.followAccount = async (data, ws) => {
    try {
        const { error } = followAccountSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }

        await Account.updateOne(
            { _id: data.accountId },
            { $addToSet: { followAccounts: data.accountFollow } },
            { useFindAndModify: false }
        )

        await Account.updateOne(
            { _id: data.accountFollow },
            { $addToSet: { followingAccounts: data.accountId } },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.unfollowAccount = async (data, ws) => {
    try {
        const { error } = followAccountSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }

        await Account.updateOne(
            { _id: data.accountId },
            { $pull: { followAccounts: data.accountFollow } },
            { useFindAndModify: false }
        )

        await Account.updateOne(
            { _id: data.accountFollow },
            { $pull: { followingAccounts: data.accountId } },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

const followResourceSchema = Joi.object({
    accountId: Joi.string().required(),
    resourceId: Joi.string().required(),
    type: Joi.string().required(),
}).unknown(true)

module.exports.followResource = async (data, ws) => {
    try {
        const { error } = followResourceSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }

        await Account.updateOne(
            { _id: data.accountId },
            {
                $addToSet: {
                    [data.type === 'goal'
                        ? 'followProgresses'
                        : data.type === 'reward'
                        ? 'followRewards'
                        : 'followActivities']: data.resourceId,
                },
            },
            { useFindAndModify: false }
        )
        const model =
            data.type === 'goal'
                ? Progress
                : data.type === 'reward'
                ? Reward
                : Activity
        await model.updateOne(
            { _id: data.resourceId },
            { $addToSet: { followingAccounts: data.accountId } },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.unfollowResource = async (data, ws) => {
    try {
        const { error } = followResourceSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }

        await Account.updateOne(
            { _id: data.accountId },
            {
                $pull: {
                    [data.type === 'goal'
                        ? 'followProgresses'
                        : data.type === 'reward'
                        ? 'followRewards'
                        : 'followActivities']: data.resourceId,
                },
            },
            { useFindAndModify: false }
        )
        const model =
            data.type === 'goal'
                ? Progress
                : data.type === 'reward'
                ? Reward
                : Activity
        await model.updateOne(
            { _id: data.resourceId },
            { $pull: { followingAccounts: data.accountId } },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}
