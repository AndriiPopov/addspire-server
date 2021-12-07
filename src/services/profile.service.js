const httpStatus = require('http-status')
const { Account, Reputation } = require('../models')
const ApiError = require('../utils/ApiError')

const { saveTags } = require('./tag.service')

const createProfile = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { label } = body

        const accountObj = await Account.findById(accountId)
            .select('profiles defaultProfile')
            .lean()

        if (accountObj) {
            const defaultProfile = accountObj.profiles.find(
                (item) =>
                    item._id.toString() === accountObj.defaultProfile.toString()
            )

            if (defaultProfile) {
                const res = await Account.updateOne(
                    { _id: accountId },
                    {
                        $push: {
                            profiles: {
                                label: label || 'New profile',
                                name: defaultProfile.name,
                                tags: defaultProfile.tags,
                                image: defaultProfile.image,
                                images: defaultProfile.images,
                                description: defaultProfile.description,
                                address: defaultProfile.address,
                                phone: defaultProfile.phone,
                                web: defaultProfile.web,
                                email: defaultProfile.email,
                                location: defaultProfile.location,
                                locationName: defaultProfile.locationName,
                            },
                        },
                    },
                    { useFindAndModify: false }
                )
                if (res.nModified) return
            }
        }

        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const editProfile = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { profileId, ...bodyToSave } = body

        const updateData = {}
        Object.keys(bodyToSave).forEach((key) => {
            updateData[`profiles.$.${key}`] = bodyToSave[key]
        })
        const res = await Account.updateOne(
            { _id: accountId, 'profiles._id': profileId },
            { $set: updateData },
            { useFindAndModify: false }
        )

        if (!res.nModified) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        }

        await Reputation.updateMany(
            { owner: accountId, profile: profileId },
            {
                $set: {
                    name: body.name,
                    image: body.image,
                    tags: body.tags,
                    label: body.label,
                },
            },
            { useFindAndModify: false }
        )

        saveTags(body.tags)
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const deleteProfile = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { profileId } = body

        const accountObj = await Account.findOneAndUpdate(
            {
                _id: accountId,
                'profiles._id': profileId,
                defaultProfile: { $ne: profileId },
            },
            { $pull: { profiles: { _id: profileId } } },
            { useFindAndModify: false }
        )
            .select('profiles defaultProfile')
            .lean()
        if (!accountObj) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        }

        if (accountObj) {
            const newProfile = accountObj.profiles.find(
                (item) =>
                    item._id.toString() === accountObj.defaultProfile.toString()
            )
            if (newProfile) {
                const result = await Reputation.updateMany(
                    { owner: accountId, profile: profileId },
                    {
                        $set: {
                            profile: newProfile._id,
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
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const chooseDefaultProfile = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { profileId } = body

        const res = await Account.updateOne(
            { _id: accountId, 'profiles._id': profileId },
            { $set: { defaultProfile: profileId } },
            { useFindAndModify: false }
        )
        if (!res.nModified) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

module.exports = {
    createProfile,
    editProfile,
    deleteProfile,
    chooseDefaultProfile,
}
