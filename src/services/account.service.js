const httpStatus = require('http-status')
const { System, Club, Account, Reputation } = require('../models')
const ApiError = require('../utils/ApiError')

const getReputationId = require('../utils/getReputationId')
const getModelFromType = require('../utils/getModelFromType')
const { saveTags } = require('./tag.service')

const getFollowingPrefix = (type) => {
    switch (type) {
        case 'reputation':
            return 'following'
        case 'club':
            return 'followingClubs'
        case 'question':
            return 'followingQuestions'
        default:
            return ''
    }
}

const follow = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { type, resourceId } = body

        const newNotificationId = await System.getNotificationId()
        const prefix = getFollowingPrefix(type)

        const result = await Account.updateOne(
            { _id: accountId, [prefix]: { $ne: resourceId } },
            { $push: { [prefix]: resourceId } },
            { useFindAndModify: false }
        )

        if (result.nModified) {
            const model = getModelFromType(type)
            const resource = await model
                .findOneAndUpdate(
                    {
                        _id: resourceId,
                        followers: { $ne: accountId },
                        user: { $ne: accountId },
                    },
                    {
                        $push: { followers: accountId },
                        $inc: { followersCount: 1 },
                    },
                    { useFindAndModify: false }
                )
                .select('user')
                .lean()
                .exec()
            if (resource && resource.user && type === 'reputation') {
                await Account.updateOne(
                    { _id: resource.user },
                    {
                        push: {
                            myNotifications: {
                                $each: [
                                    {
                                        user: accountId,
                                        code: 'follow',
                                        details: {
                                            accountId: resourceId,
                                        },
                                        notId: newNotificationId,
                                    },
                                ],
                                $slice: -50,
                            },
                        },
                    },
                    { useFindAndModify: false }
                )
            }
        } else {
            throw new ApiError(httpStatus.CONFLICT, 'Already follows')
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const unfollow = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { type, resourceId } = body

        const prefix = getFollowingPrefix(type)

        const result = await Account.updateOne(
            { _id: accountId, [prefix]: resourceId },
            { $pull: { [prefix]: resourceId } },
            { useFindAndModify: false }
        )
        if (result.nModified) {
            const model = getModelFromType(type)
            await model.updateOne(
                { _id: resourceId, followers: accountId },
                {
                    $pull: { followers: accountId },
                    $inc: { followersCount: -1 },
                },
                { useFindAndModify: false }
            )
        } else {
            throw new ApiError(httpStatus.CONFLICT, 'Not following')
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const deleteAccount = async (req) => {
    try {
        const { account } = req
        const { _id: accountId } = account

        const accountObj = await Account.findOneAndDelete({ _id: accountId })
            .select('reputations')
            .exec()

        if (accountObj) {
            const clubs = accountObj.reputations.map((item) => item.clubId)
            const reputations = accountObj.reputations.map(
                (item) => item.reputationId
            )
            await Club.updateMany(
                {
                    _id: { $in: clubs },
                },
                {
                    $pull: {
                        reputations: { accountId },
                        adminReputations: { accountId },
                    },
                    $inc: { reputationsCount: -1 },
                },
                { useFindAndModify: false }
            )

            await Reputation.deleteMany(
                { _id: { $in: reputations } },
                { useFindAndModify: false }
            )
            return { success: true }
        }
        throw new ApiError(httpStatus.CONFLICT, 'Not exist')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const starClub = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { clubId, add } = body

        await Account.updateOne(
            { _id: accountId },
            {
                [add ? '$addToSet' : '$pull']: {
                    starredClubs: clubId,
                },
            },
            { useFindAndModify: false }
        )
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const editAccount = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { name, description, contact, image, tags } = body

        await Account.updateOne(
            { _id: accountId },
            { $set: { name, description, contact, image, tags } },
            { useFindAndModify: false }
        )
        saveTags(tags)
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const seenNotification = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { notId } = body

        if (notId === 'all') {
            await Account.updateOne(
                { _id: accountId },
                { $set: { 'myNotifications.$.seen': true } },
                { useFindAndModify: false }
            )
        } else {
            await Account.updateOne(
                {
                    _id: accountId,
                    'myNotifications._id': notId,
                },
                { $set: { 'myNotifications.$.seen': true } },
                { useFindAndModify: false }
            )
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

module.exports = {
    follow,
    unfollow,
    starClub,
    deleteAccount,
    editAccount,
    seenNotification,
}
