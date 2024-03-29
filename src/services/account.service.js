const httpStatus = require('http-status')
const { System, Club, Account, Reputation } = require('../models')
const ApiError = require('../utils/ApiError')

const getReputationId = require('../utils/getReputationId')
const getModelFromType = require('../utils/getModelFromType')
const { saveTags } = require('./tag.service')
const notificationService = require('./notification.service')

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

        if (type === 'club') {
            const reputationLean = await getReputationId(accountId, resourceId)

            await Reputation.updateOne(
                { _id: reputationLean._id },
                { $set: { member: true } },
                { useFindAndModify: false }
            )
        }
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
                        $addToSet: { followers: accountId },
                        $inc: { followersCount: 1 },
                    },
                    { useFindAndModify: false }
                )
                .select('user clubName club')
                .lean()
                .exec()
            if (resource && resource.user && type === 'reputation') {
                await Account.updateOne(
                    { _id: resource.user },
                    {
                        $push: {
                            notifications: {
                                $each: [
                                    {
                                        user: accountId,
                                        code: 'follow',
                                        details: {
                                            clubProfileId: resourceId,
                                            clubName: resource.clubName,
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

                notificationService.notify(resource.user, {
                    key: 'newFollower',
                    body: { clubName: resource.clubName },
                    data: {
                        id: account._id,
                        type: 'user',
                    },
                })
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
        if (type === 'club') {
            await Reputation.updateOne(
                { owner: accountId, club: resourceId },
                { $set: { member: false } },
                { useFindAndModify: false }
            )
        }
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

        const res1 = await Account.deleteOne(
            { _id: accountId },
            { useFindAndModify: false }
        )

        if (res1.deletedCount) {
            const reputations = await Reputation.find({
                owner: accountId,
                admin: true,
            })
                .select('club')
                .lean()
                .exec()
            if (reputations.length) {
                const reputationsClubs = reputations.map((rep) => rep.club)
                const reputationsIds = reputations.map((rep) => rep._id)
                await Club.updateMany(
                    { _id: { $in: reputationsClubs } },
                    {
                        $pullAll: { adminReputations: reputationsIds },
                        $inc: { adminsCount: -1 },
                    },
                    { useFindAndModify: false }
                )
            }

            await Reputation.deleteMany(
                { owner: accountId },
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

        await Reputation.updateOne(
            { owner: accountId, club: clubId },
            { $set: { starred: add } },
            { useFindAndModify: false }
        )
        return add
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
                { $set: { 'notifications.$[].seen': true } },
                { useFindAndModify: false }
            )
        } else {
            await Account.updateOne(
                {
                    _id: accountId,
                    'notifications.notId': notId,
                },
                { $set: { 'notifications.$.seen': true } },
                { useFindAndModify: false }
            )
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const seenFeed = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { id } = body

        await Account.updateOne(
            { _id: accountId },
            { $set: { 'feed.$[elem].seen': true } },
            {
                useFindAndModify: false,
                arrayFilters: [{ 'elem.questionId': id }],
                multi: true,
            }
        )
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const saveNotificationToken = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { token } = body

        await Account.updateMany(
            { expoTokens: token },
            { $pull: { expoTokens: token } },
            { useFindAndModify: false }
        )

        await Account.updateOne(
            { _id: accountId },
            { $addToSet: { expoTokens: token } },
            { useFindAndModify: false }
        )
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const removeNotificationToken = async (req) => {
    try {
        const { body } = req
        const { token } = body

        await Account.updateMany(
            { expoTokens: token },
            { $pull: { expoTokens: token } },
            { useFindAndModify: false }
        )
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const language = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { language: lang } = body

        await Account.updateOne(
            { _id: accountId },
            { $set: { language: lang } },
            { useFindAndModify: false }
        )
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const visitClub = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { id } = body

        await Account.updateOne(
            { _id: accountId, lastClubVisits: { $ne: id } },
            {
                $push: {
                    lastClubVisits: { $each: [id], $position: 0, $slice: 10 },
                },
            }
        )

        await Account.updateOne(
            { _id: accountId },
            {
                $push: {
                    topClubVisits: { $each: [id], $position: 0, $slice: 100 },
                },
            }
        )
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
    seenNotification,
    seenFeed,
    saveNotificationToken,
    removeNotificationToken,
    language,
    visitClub,
}
