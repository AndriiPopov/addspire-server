const httpStatus = require('http-status')
const { tokenService, tagService } = require('.')
const config = require('../config/config')
const { tokenTypes } = require('../config/tokens')
const value = require('../config/value')
const { Account, Club, Reputation, System } = require('../models')
const ApiError = require('../utils/ApiError')
const getReputationId = require('../utils/getReputationId')
const { saveTags } = require('./tag.service')

const createClub = async (req) => {
    try {
        const { account, body } = req
        const { image, name, description, startConversation, tags } = body
        const { _id: accountId } = account

        const reputation = new Reputation({
            user: accountId,
            admin: true,
        })

        const club = new Club({
            adminReputations: [{ reputationId: reputation._id, accountId }],
            reputations: [
                { reputationId: reputation._id, accountId, admin: true },
            ],
            reputationsCount: 1,
            adminsCount: 1,
            followers: [accountId],
            followersCount: 1,
            name,
            image,
            description,
            startConversation,
            tags,
        })

        saveTags(tags)

        reputation.club = club._id
        await club.save()
        await reputation.save()
        const newNotificationId = await System.getNotificationId()

        await Account.updateOne(
            { _id: accountId },
            {
                $push: {
                    followingClubs: club._id,
                    reputations: {
                        clubId: club._id,
                        reputationId: reputation._id,
                        admin: true,
                    },
                    notifications: {
                        $each: [
                            {
                                user: accountId,
                                code: 'create new club',
                                details: {
                                    id: club._id,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: 5,
                    },
                },
                $inc: { reputationsCount: 1 },
            },
            { useFindAndModify: false }
        )
        return club
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const editClub = async (req) => {
    try {
        const { account, body } = req
        const { image, name, description, startConversation, clubId, tags } =
            body
        const { _id: accountId } = account

        const reputationLean = await getReputationId(accountId, clubId, true)

        if (!reputationLean.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        await Club.updateOne(
            {
                _id: clubId,
            },
            {
                $set: {
                    name,
                    image,
                    description,
                    startConversation,
                    tags,
                },
            },
            { useFindAndModify: false }
        )
        saveTags(tags)
        return { success: true }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const invite = async (req) => {
    try {
        const { account, body } = req
        const { clubId } = body
        const { _id: accountId } = account

        const reputationLean = await getReputationId(accountId, clubId, true)

        if (!reputationLean.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const token = await tokenService.generateInviteToken(
            req.account,
            clubId
        )

        const inviteLink = `${config.baseUrl}club/${clubId}?invite=${token}`

        return inviteLink
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const acceptInvite = async (req) => {
    try {
        const { account, body } = req
        const { code } = body
        const { _id: accountId } = account

        const doc = await tokenService.verifyInviteToken(
            code,
            tokenTypes.INVITE
        )

        if (!doc) {
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Token is used or is not exist'
            )
        }

        const reputationLean = await getReputationId(accountId, doc.club, true)
        const reputationId = reputationLean._id.toString()

        if (reputationLean.admin) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Already admin')
        }

        const newNotificationId = await System.getNotificationId()
        const notification = {
            $each: [
                {
                    user: accountId,
                    code: 'became admin',
                    details: { clubId: doc.club },
                    notId: newNotificationId,
                },
            ],
            $slice: 5,
        }

        const res1 = await Club.updateOne(
            { _id: doc.club, adminsCount: { $lt: value.maxAdmins } },
            {
                $push: {
                    adminReputations: { reputationId, accountId },
                    notifications: notification,
                },
                $inc: { adminsCount: 1 },
            },
            { useFindAndModify: false }
        )
        if (res1.nModified) {
            await Reputation.updateOne(
                {
                    _id: reputationId,
                },
                { $set: { admin: true } },
                { useFindAndModify: false }
            )

            await Account.updateOne(
                { _id: accountId },
                {
                    $push: {
                        notifications: notification,
                    },
                },
                { useFindAndModify: false }
            )
        } else {
            throw new ApiError(httpStatus.CONFLICT, 'Max admins reached')
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const addResident = async (req) => {
    try {
        const { account, body } = req
        const { clubId, residentId } = body
        const { _id: accountId } = account

        const reputationLeanAdmin = await getReputationId(
            accountId,
            clubId,
            true
        )

        if (!reputationLeanAdmin.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not an admin')
        }

        const reputationLean = await getReputationId(residentId, clubId, true)
        const reputationId = reputationLean._id.toString()

        if (reputationLean.admin) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Already admin')
        }

        const newNotificationId = await System.getNotificationId()
        const notification = {
            $each: [
                {
                    user: accountId,
                    code: 'became admin',
                    details: { clubId },
                    notId: newNotificationId,
                },
            ],
            $slice: 5,
        }

        const res1 = await Club.updateOne(
            { _id: clubId, adminsCount: { $lt: value.maxAdmins } },
            {
                $push: {
                    adminReputations: { reputationId, accountId: residentId },
                    notifications: notification,
                    followers: residentId,
                },
                $inc: { adminsCount: 1, followersCount: 1 },
            },
            { useFindAndModify: false }
        )
        if (res1.nModified) {
            await Reputation.updateOne(
                {
                    _id: reputationId,
                },
                { $set: { admin: true } },
                { useFindAndModify: false }
            )

            await Account.updateOne(
                { _id: residentId },
                {
                    $push: {
                        notifications: notification,
                        followingClubs: clubId,
                    },
                },
                { useFindAndModify: false }
            )
        } else {
            throw new ApiError(httpStatus.CONFLICT, 'Max admins reached')
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const leaveResidence = async (req) => {
    try {
        const { account, body } = req
        const { clubId } = body
        const { _id: accountId } = account

        const reputationLean = await getReputationId(accountId, clubId, true)
        const reputationId = reputationLean._id.toString()

        if (!reputationLean.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not an admin')
        }

        const newNotificationId = await System.getNotificationId()
        const notification = {
            $each: [
                {
                    user: accountId,
                    code: 'left residence',
                    details: { clubId },
                    notId: newNotificationId,
                },
            ],
            $slice: 5,
        }

        await Club.updateOne(
            { _id: clubId },
            {
                $pull: { adminReputations: { reputationId } },
                $push: { notifications: notification },
                $inc: { adminsCount: -1 },
            },
            { useFindAndModify: false }
        )

        await Reputation.updateOne(
            { _id: reputationId },
            { $set: { admin: false } },
            { useFindAndModify: false }
        )

        await Account.updateOne(
            { _id: accountId },
            { $push: { notifications: notification } },
            { useFindAndModify: false }
        )
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const requestResidence = async (req) => {
    try {
        const { account, body } = req
        const { clubId, message, contact } = body
        const { _id: accountId } = account

        const reputationLean = await getReputationId(accountId, clubId, true)
        if (reputationLean.admin) {
            throw new ApiError(httpStatus.CONFLICT, 'AlreadyAdmin')
        }
        const newNotificationId = await System.getNotificationId()
        const notification = {
            $each: [
                {
                    user: accountId,
                    code: 'request residence',
                    details: { clubId },
                    notId: newNotificationId,
                },
            ],
            $slice: 5,
        }

        const res = await Club.updateOne(
            {
                _id: clubId,
                adminsCount: { $lt: value.maxAdmins },
                'residenceRequests.accountId': { $ne: accountId },
            },
            {
                $push: {
                    notifications: notification,
                    residenceRequests: { message, contact, accountId },
                },
            },
            { useFindAndModify: false }
        )
        if (res.nModified)
            await Account.updateOne(
                { _id: accountId },
                { $push: { notifications: notification } },
                { useFindAndModify: false }
            )
        else throw new ApiError(httpStatus.CONFLICT, 'Already requested')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const acceptResidenceRequest = async (req) => {
    try {
        const { account, body } = req
        const { clubId, requestId, residentId } = body
        const { _id: accountId } = account

        const reputationLeanAdmin = await getReputationId(
            accountId,
            clubId,
            true
        )
        if (!reputationLeanAdmin.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not an admin')
        }

        const newNotificationId = await System.getNotificationId()
        const notification = {
            $each: [
                {
                    user: accountId,
                    code: 'accept residence request',
                    details: { clubId, residentId },
                    notId: newNotificationId,
                },
            ],
            $slice: 5,
        }

        const reputationLean = await getReputationId(residentId, clubId, true)
        if (reputationLean.admin) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Already admin')
        }
        const reputationId = reputationLean._id.toString()

        const res = await Club.updateOne(
            {
                _id: clubId,
                adminsCount: { $lt: value.maxAdmins },
                'residenceRequests._id': requestId,
            },
            {
                $pull: { residenceRequests: { _id: requestId } },
                $push: {
                    adminReputations: { reputationId, accountId: residentId },
                    notifications: notification,
                    followers: residentId,
                },
                $inc: { adminsCount: 1, followersCount: 1 },
            },
            { useFindAndModify: false }
        )

        if (res.nModified) {
            await Reputation.updateOne(
                { _id: reputationId },
                { $set: { admin: true } },
                { useFindAndModify: false }
            )

            await Account.updateOne(
                { _id: residentId },
                {
                    $push: {
                        notifications: notification,
                        followingClubs: clubId,
                    },
                },
                { useFindAndModify: false }
            )
        } else {
            await Club.updateOne(
                { _id: clubId },
                { $pull: { residenceRequests: { _id: requestId } } },
                { useFindAndModify: false }
            )
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                'Max admins or already an admin'
            )
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const declineResidenceRequest = async (req) => {
    try {
        const { account, body } = req
        const { clubId, requestId, residentId } = body
        const { _id: accountId } = account

        const reputationLeanAdmin = await getReputationId(
            accountId,
            clubId,
            true
        )
        if (!reputationLeanAdmin.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not an admin')
        }

        const newNotificationId = await System.getNotificationId()
        const notification = {
            $each: [
                {
                    user: accountId,
                    code: 'decline residence request',
                    details: { clubId, residentId },
                    notId: newNotificationId,
                },
            ],
            $slice: 5,
        }

        await Account.updateOne(
            { _id: residentId },
            { $push: { notifications: notification } },
            { useFindAndModify: false }
        )

        await Club.updateOne(
            { _id: clubId },
            { $pull: { residenceRequests: { _id: requestId } } },
            { useFindAndModify: false }
        )
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

module.exports = {
    createClub,
    editClub,
    invite,
    acceptInvite,
    addResident,
    leaveResidence,
    requestResidence,
    acceptResidenceRequest,
    declineResidenceRequest,
}
