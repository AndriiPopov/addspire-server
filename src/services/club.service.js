const httpStatus = require('http-status')
const { tokenService } = require('.')
const notificationService = require('./notification.service')
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
        const {
            image,
            name,
            description,
            tags,
            global,
            location,
            clubAddress,
        } = body
        const { _id: accountId } = account

        const reputation = new Reputation({
            owner: accountId,
            admin: true,
            clubName: name,
            clubImage: image,

            member: true,
            global,
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
            global,
        })
        if (!global) {
            club.location = {
                type: 'Point',
                coordinates: [location.longitude, location.latitude],
            }
            club.clubAddress = clubAddress

            reputation.location = club.location
            reputation.clubAddress = club.clubAddress
        }

        const accountObj = await Account.findOneAndUpdate(
            { _id: accountId },
            {
                $push: {
                    followingClubs: club._id,
                    reputations: {
                        reputation: reputation._id,
                        club: club._id,
                    },
                },
                $inc: { reputationsCount: 1 },
            },
            { useFindAndModify: false }
        )
            .select(
                'profiles.image profiles.name profiles.tags profiles._id profiles.label defaultProfile'
            )
            .lean()
            .exec()

        saveTags(tags)

        if (accountObj) {
            const defaultProfile = accountObj.profiles.find(
                (item) =>
                    item._id.toString() === accountObj.defaultProfile.toString()
            )
            if (defaultProfile) {
                reputation.name = defaultProfile.name
                reputation.image = defaultProfile.image
                reputation.tags = defaultProfile.tags
                reputation.label = defaultProfile.label

                reputation.profile = accountObj.defaultProfile

                reputation.club = club._id
                await club.save()
                await reputation.save()

                const accountReputations = await Reputation.find({
                    owner: accountId,
                })
                    .select('followers')
                    .lean()
                    .exec()

                if (accountReputations && accountReputations.length > 0) {
                    const uniqueFollowers = accountReputations.reduce(
                        (result, rep) => [
                            ...new Set([...result, ...rep.followers]),
                        ],
                        []
                    )
                    if (uniqueFollowers.length) {
                        const newNotificationId =
                            await System.getNotificationId()
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
                                                    clubName: name,
                                                    userName: accountObj.name,
                                                    image,
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
                        notificationService.notify(uniqueFollowers, {
                            key: 'createdClub',
                            body: {
                                name: reputation.name,
                                clubName: name,
                            },
                            data: {
                                id: club._id,
                                type: 'club',
                            },
                        })
                    }
                }

                return club
            }
        }
        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const editClub = async (req) => {
    try {
        const { account, body } = req
        const { image, name, description, clubId, tags, clubAddress } = body
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
                    clubAddress,
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
            .select('followers name')
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
            const notifiedAccounts = club.followers.filter(
                (i) => i.toString() !== accountId.toString()
            )
            await Account.updateMany(
                { _id: { $in: notifiedAccounts } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'became admin',
                                    details: {
                                        clubId: doc.club,
                                        clubName: club.name,
                                        userName: reputationLean.name,
                                        image: reputationLean.image,
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
            notificationService.notify(notifiedAccounts, {
                key: 'newExpert',
                body: { name: reputationLean.name, clubName: club.name },
                data: {
                    id: club._id,
                    type: 'club',
                },
            })
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
            .select('followers name')
            .lean()
            .exec()
        if (club) {
            await Reputation.updateOne(
                { _id: reputationId },
                { $set: { admin: true, banned: false } },
                { useFindAndModify: false }
            )

            const newNotificationId = await System.getNotificationId()
            const notifiedAccounts = club.followers.filter(
                (i) => i.toString() !== accountId.toString()
            )
            await Account.updateMany(
                { _id: { $in: notifiedAccounts } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: residentId,
                                    code: 'became admin',
                                    details: {
                                        clubId,
                                        clubName: club.name,
                                        userName: reputationLean.name,
                                        image: reputationLean.image,
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
            notificationService.notify(notifiedAccounts, {
                key: 'newExpert',
                body: { name: reputationLean.name, clubName: club.name },
                data: {
                    id: club._id,
                    type: 'club',
                },
            })
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
            .select('followers name')
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
                { _id: { $in: club.followers } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'left residence',
                                    details: {
                                        clubId,
                                        clubName: club.name,
                                        userName: reputationLean.name,
                                        image: reputationLean.image,
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
            notificationService.notify(club.followers, {
                key: 'leaveExpert',
                body: { name: reputationLean.name, clubName: club.name },
                data: {
                    id: club._id,
                    type: 'club',
                },
            })
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
        const { clubId, message } = body
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
                        accountId,
                        reputationId: reputationLean._id,
                    },
                },
            },
            { useFindAndModify: false }
        )
            .select('adminReputations name')
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
                const notifiedAccounts = reputations
                    .map((rep) => rep.owner)
                    .filter((i) => i.toString() !== accountId.toString())

                await Account.updateMany(
                    { _id: { $in: notifiedAccounts } },
                    {
                        $push: {
                            notifications: {
                                $each: [
                                    {
                                        user: accountId,
                                        code: 'request residence',
                                        details: {
                                            clubId,
                                            clubName: club.name,
                                            userName: reputationLean.name,
                                            image: reputationLean.image,
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
                notificationService.notify(notifiedAccounts, {
                    key: 'expertRequest',
                    body: { name: reputationLean.name, clubName: club.name },
                    data: {
                        id: club._id,
                        type: 'club',
                        param: 'residenceRequests',
                    },
                })
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
                },
                $inc: { adminsCount: 1 },
            },
            { useFindAndModify: false }
        )
            .select('followers name image')
            .lean()
            .exec()

        if (club) {
            await Reputation.updateOne(
                { _id: reputationId },
                { $set: { admin: true, banned: false } },
                { useFindAndModify: false }
            )

            const newNotificationId = await System.getNotificationId()
            const notifiedAccounts = [
                ...club.followers.filter(
                    (i) => i.toString() !== accountId.toString()
                ),
                residentId,
            ]
            await Account.updateMany(
                { _id: { $in: notifiedAccounts } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: residentId,
                                    code: 'accept residence request',
                                    details: {
                                        clubId,
                                        clubName: club.name,
                                        image: club.image,
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
            notificationService.notify(notifiedAccounts, {
                key: 'newExpert',
                body: { name: reputationLean.name, clubName: club.name },
                data: {
                    id: club._id,
                    type: 'club',
                },
            })
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

        const club = await Club.findOneAndUpdate(
            { _id: clubId },
            { $pull: { residenceRequests: { _id: requestId } } },
            { useFindAndModify: false }
        )
            .select('name image')
            .lean()
            .exec()

        await Account.updateOne(
            { _id: residentId },
            {
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: residentId,
                                code: 'decline residence request',
                                details: {
                                    clubId,
                                    clubName: club.name,
                                    image: club.image,
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
        notificationService.notify(residentId, {
            key: 'expertRequestDeclined',
            body: { clubName: club.name },
            data: {
                id: club._id,
                type: 'club',
            },
        })
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
            .select('followers name image')
            .lean()
            .exec()

        if (club && club.followers.length) {
            const newNotificationId = await System.getNotificationId()
            await Account.updateMany(
                { _id: { $in: club.followers } },
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'changed rules',
                                    details: {
                                        clubId,
                                        clubName: club.name,
                                        image: club.image,
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
            notificationService.notify(club.followers, {
                key: 'rulesChange',
                body: { clubName: club.name },

                data: {
                    id: club._id,
                    type: 'club',
                },
            })
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

        const reputation = await Reputation.findOneAndUpdate(
            { _id: reputationId, admin: false },
            { $set: { banned: banning } },
            { useFindAndModify: false }
        )
            .select('owner club clubName image')
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
                {
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: accountId,
                                    code: banning ? 'ban' : 'unban',
                                    details: {
                                        reputationId,
                                        image: reputation.image,
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
            notificationService.notify(reputation.owner, {
                key: banning ? 'banned' : 'unbanned',
                body: {
                    clubName: reputation.clubName,
                },
                data: {
                    id: reputation.name,
                    type: 'club',
                },
            })
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
        const { profileId, reputationId } = body
        const { _id: accountId } = account

        const accountObj = await Account.findById(accountId)
            .select(
                'profiles._id profiles.name profiles.image profiles.tags profiles.label'
            )
            .lean()

        if (accountObj) {
            const newProfile = accountObj.profiles.find(
                (item) => item._id.toString() === profileId.toString()
            )
            if (newProfile) {
                const result = await Reputation.updateOne(
                    { _id: reputationId, owner: accountId },
                    {
                        $set: {
                            profile: profileId,
                            name: newProfile.name,
                            tags: newProfile.tags,
                            image: newProfile.image,
                            label: newProfile.label,
                        },
                    },
                    { useFindAndModify: false }
                )

                if (result.nModified) return
            }
        }
        throw new ApiError(httpStatus.CONFLICT, 'badRequest')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const getReputationIdService = async (req) => {
    try {
        const { account, body } = req
        const { clubId } = body
        const { _id: accountId } = account
        const reputationLean = await getReputationId(accountId, clubId)
        return reputationLean._id
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
    getReputationId: getReputationIdService,
}
