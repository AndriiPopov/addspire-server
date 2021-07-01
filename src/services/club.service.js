const httpStatus = require('http-status')
const { tokenService } = require('.')
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
        const { image, name, description, tags } = body
        const { _id: accountId } = account

        const reputation = new Reputation({
            owner: accountId,
            admin: true,
            clubName: name,
            clubImage: image,
            member: true,
        })

        const club = new Club({
            adminReputations: [reputation._id],
            reputationsCount: 1,
            adminsCount: 1,
            followers: [accountId],
            followersCount: 1,
            name,
            image,
            description,
            tags,
        })

        const accountObj = await Account.findOneAndUpdate(
            { _id: accountId },
            {
                $push: {
                    followingClubs: club._id,
                },
                $inc: { reputationsCount: 1 },
            },
            { useFindAndModify: false }
        )
            .select('image name tags')
            .lean()
            .exec()

        saveTags(tags)

        reputation.name = accountObj.name
        reputation.image = accountObj.image
        reputation.profileTags = accountObj.tags

        reputation.club = club._id
        await club.save()
        await reputation.save()

        const accountReputations = await Reputation.find({ owner: accountId })
            .select('followers')
            .lean()
            .exec()

        if (accountReputations && accountReputations.length > 0) {
            const uniqueFollowers = accountReputations.reduce(
                (result, rep) => [...new Set([...result, ...rep.followers])],
                []
            )
            if (uniqueFollowers.length) {
                const newNotificationId = await System.getNotificationId()
                await Account.updateMany(
                    { _id: { $in: uniqueFollowers } },
                    {
                        $push: {
                            notifications: {
                                $each: [
                                    {
                                        user: accountId,
                                        code: 'created club',
                                        details: {
                                            clubId: club._id,
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
        }

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
        const { image, name, description, clubId, tags } = body
        const { _id: accountId } = account

        const reputationLean = await getReputationId(accountId, clubId, true)

        if (!reputationLean.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const res = await Club.updateOne(
            { _id: clubId },
            {
                $set: {
                    name,
                    image,
                    description,
                    tags,
                },
            },
            { useFindAndModify: false }
        )

        saveTags(tags)
        if (res.nModified) {
            await Reputation.updateMany(
                { club: clubId },
                {
                    $set: {
                        clubName: name,
                        clubImage: image,
                    },
                },
                { useFindAndModify: false }
            )
        } else {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        }
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
                httpStatus.CONFLICT,
                'Token is used or is not exist'
            )
        }

        const reputationLean = await getReputationId(accountId, doc.club, true)
        const reputationId = reputationLean._id.toString()

        if (reputationLean.admin) {
            throw new ApiError(httpStatus.CONFLICT, 'Already admin')
        }

        const club = await Club.findOneAndUpdate(
            { _id: doc.club, adminsCount: { $lt: value.maxAdmins } },
            {
                $push: { adminReputations: reputationId },
                $inc: { adminsCount: 1 },
            },
            { useFindAndModify: false }
        )
            .select('followers')
            .lean()
            .exec()
        if (club) {
            await Reputation.updateOne(
                { _id: reputationId },
                { $set: { admin: true, member: true, banned: false } },
                { useFindAndModify: false }
            )

            await Account.updateOne(
                { _id: accountId, followngClubs: { $ne: accountId } },
                { $addToSet: { followngClubs: doc.club } },
                { useFindAndModify: false }
            )

            await Club.updateOne(
                { _id: doc.club, followers: { $ne: accountId } },
                {
                    $push: { followers: accountId },
                    $inc: { followersCount: 1 },
                },
                { useFindAndModify: false }
            )

            const newNotificationId = await System.getNotificationId()
            await Account.updateMany(
                { _id: { $in: [...club.followers, accountId] } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'became admin',
                                    details: { clubId: doc.club },
                                    notId: newNotificationId,
                                },
                            ],
                            $slice: -50,
                        },
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
            throw new ApiError(httpStatus.CONFLICT, 'Already admin')
        }

        const club = await Club.findOneAndUpdate(
            { _id: clubId, adminsCount: { $lt: value.maxAdmins } },
            {
                $push: { adminReputations: reputationId },
                $inc: { adminsCount: 1 },
            },
            { useFindAndModify: false }
        )
            .select('followers')
            .lean()
            .exec()
        if (club) {
            await Reputation.updateOne(
                { _id: reputationId },
                { $set: { admin: true, banned: false } },
                { useFindAndModify: false }
            )

            const newNotificationId = await System.getNotificationId()
            await Account.updateMany(
                { _id: { $in: [...club.followers, residentId] } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: residentId,
                                    code: 'became admin',
                                    details: { clubId },
                                    notId: newNotificationId,
                                },
                            ],
                            $slice: -50,
                        },
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

        const club = await Club.findOneAndUpdate(
            { _id: clubId },
            {
                $pull: { adminReputations: reputationId },
                $inc: { adminsCount: -1 },
            },
            { useFindAndModify: false }
        )
            .select('followers')
            .lean()
            .exec()

        await Reputation.updateOne(
            { _id: reputationId },
            { $set: { admin: false } },
            { useFindAndModify: false }
        )

        if (club && club.followers.length) {
            const newNotificationId = await System.getNotificationId()
            await Account.updateMany(
                { _id: { $in: [...club.followers] } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'left residence',
                                    details: { clubId },
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
            throw new ApiError(httpStatus.CONFLICT, 'Already admin')
        }

        const club = await Club.findOneAndUpdate(
            {
                _id: clubId,
                adminsCount: { $lt: value.maxAdmins },
                'residenceRequests.accountId': { $ne: accountId },
            },
            {
                $push: {
                    residenceRequests: {
                        message,
                        contact,
                        accountId,
                        reputationId: reputationLean._id,
                    },
                },
            },
            { useFindAndModify: false }
        )
            .select('adminReputations')
            .lean()
            .exec()
        if (club && club.adminReputations.length) {
            const reputations = await Reputation.find({
                _id: { $in: club.adminReputations },
            })
                .select('owner')
                .lean()
                .exec()
            if (reputations.length) {
                const newNotificationId = await System.getNotificationId()
                await Account.updateMany(
                    { _id: { $in: reputations.map((rep) => rep.owner) } },
                    {
                        $push: {
                            notifications: {
                                $each: [
                                    {
                                        user: accountId,
                                        code: 'request residence',
                                        details: { clubId },
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
        } else throw new ApiError(httpStatus.CONFLICT, 'Already requested')
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

        const reputationLean = await getReputationId(residentId, clubId, true)
        if (reputationLean.admin) {
            throw new ApiError(httpStatus.CONFLICT, 'Already admin')
        }
        const reputationId = reputationLean._id.toString()

        const club = await Club.findOneAndUpdate(
            {
                _id: clubId,
                adminsCount: { $lt: value.maxAdmins },
                'residenceRequests._id': requestId,
            },
            {
                $pull: { residenceRequests: { _id: requestId } },
                $push: {
                    adminReputations: reputationId,
                    followers: residentId,
                },
                $inc: { adminsCount: 1, followersCount: 1 },
            },
            { useFindAndModify: false }
        )
            .select('followers')
            .lean()
            .exec()

        if (club) {
            await Reputation.updateOne(
                { _id: reputationId },
                { $set: { admin: true, banned: false } },
                { useFindAndModify: false }
            )

            const newNotificationId = await System.getNotificationId()
            await Account.updateMany(
                { _id: { $in: [...club.followers, residentId] } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'accept residence request',
                                    details: { clubId, residentId },
                                    notId: newNotificationId,
                                },
                            ],
                            $slice: -50,
                        },
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
                httpStatus.CONFLICT,
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
            $slice: -50,
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

const editStartRule = async (req) => {
    try {
        const { account, body } = req
        const { value: ruleValue, clubId } = body
        const { _id: accountId } = account

        const reputationLean = await getReputationId(accountId, clubId, true)

        if (!reputationLean.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const club = await Club.findOneAndUpdate(
            { _id: clubId },
            { $set: { startConversation: ruleValue } },
            { useFindAndModify: false }
        )
            .select('followers')
            .lean()
            .exec()

        if (club && club.followers.length) {
            const newNotificationId = await System.getNotificationId()
            await Account.updateMany(
                { _id: { $in: [...club.followers] } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'changed rules',
                                    details: { clubId, rule: ruleValue },
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
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const ban = async (req) => {
    try {
        const { account, body } = req
        const { reputationId, clubId, banning } = body
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
                    code: banning ? 'ban' : 'unban',
                    details: { clubId, reputationId },
                    notId: newNotificationId,
                },
            ],
            $slice: -50,
        }

        const reputation = await Reputation.findOneAndUpdate(
            { _id: reputationId, admin: false },
            { $set: { banned: banning } },
            { useFindAndModify: false }
        )
            .select('owner')
            .lean()
            .exec()
        if (reputation) {
            await Club.updateOne(
                { _id: clubId },
                { [banning ? '$push' : '$pull']: { banned: reputationId } },
                { useFindAndModify: false }
            )
            await Account.updateOne(
                { _id: reputation.owner },
                { $push: { notifications: notification } },
                { useFindAndModify: false }
            )
        } else {
            throw new ApiError(httpStatus.CONFLICT, 'badRequest')
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const editReputation = async (req) => {
    try {
        const { account, body } = req
        const { reputationId, description, tags } = body
        const { _id: accountId } = account

        const result = await Reputation.updateOne(
            { _id: reputationId, owner: accountId },
            { $set: { description, tags } },
            { useFindAndModify: false }
        )

        if (!result.nModified) {
            throw new ApiError(httpStatus.CONFLICT, 'badRequest')
        }
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
    editStartRule,
    ban,
    editReputation,
}
