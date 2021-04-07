const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendError, sendSuccess } = require('./confirm')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { Account } = require('../models/account')
const { Community } = require('../models/community')

module.exports.createCommunity = async (data, ws) => {
    try {
        const { value } = data

        const community = new Community({
            sadmins: [ws.account],
            owner: ws.account,
            image: value.images.length ? value.images[0] : '',
            users: [ws.account],
            usersCount: 1,
            likes: [ws.account],
            likesCount: 1,
            followers: [ws.account],
            followersCount: 1,
            ...value,
        })
        await community.save()
        const newNotificationId = await getNotificationId()

        await Account.updateOne(
            { _id: ws.account },
            {
                $push: {
                    sadmin: community._id,
                    following: {
                        item: community._id,
                        itemType: 'community',
                    },
                    communities: community._id,
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'create new community',
                                details: {
                                    id: community._id,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: -20,
                    },
                },
                $inc: { followingCount: 1 },
                $inc: { communitiesCount: 1 },
            },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The new Community is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.becomeMember = async (data, ws) => {
    try {
        const { communityId } = data

        await Account.updateOne(
            { _id: ws.account, communities: { $ne: communityId } },
            {
                $push: {
                    communities: communityId,
                },
                $inc: { communitiesCount: 1 },
            },
            { useFindAndModify: false }
        )
        await Community.updateOne(
            { _id: communityId, users: { $ne: ws.account } },
            {
                $push: {
                    users: ws.account,
                },
                $inc: { usersCount: 1 },
            },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The new Community is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.leave = async (data, ws) => {
    try {
        const { communityId } = data

        await Account.updateOne(
            { _id: ws.account, communities: communityId },
            {
                $pull: {
                    communities: communityId,
                    // admin: communityId,
                    // sadmin: communityId,
                },
                $inc: { communitiesCount: -1 },
            },
            { useFindAndModify: false }
        )
        await Community.updateOne(
            { _id: communityId, users: ws.account },
            {
                $pull: {
                    users: ws.account,
                    // admins: ws.account,
                    // sadmins: ws.account,
                },
                $inc: { usersCount: -1 },
            },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The new Community is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
