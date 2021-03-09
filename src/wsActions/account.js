const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
Joi.objectId = require('joi-objectid')(Joi)
const { JoiLength } = require('../constants/fieldLength')

const getAccount = require('../utils/getAccount')
const { sendSuccess, sendError } = require('./confirm')
const { getNotificationId } = require('../models/system')

const { Version } = require('../models/version')
const { Advice } = require('../models/advice')
const { Structure } = require('../models/structure')
const { Board } = require('../models/board')

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
        await Account.updateOne(
            { _id: ws.account },
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

module.exports.addImage = async (data, ws) => {
    try {
        await Account.updateOne(
            { _id: ws.account },
            { $push: { images: data.image } },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}

module.exports.deleteImage = async (data, ws) => {
    try {
        await Account.updateOne(
            { _id: ws.account },
            { $pull: { images: data.image } },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}

module.exports.setAvatar = async (data, ws) => {
    try {
        await Account.updateOne(
            { _id: ws.account },
            { $set: { image: data.image } },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}

module.exports.saveAboutUser = async (data, ws) => {
    try {
        await Account.updateOne(
            { _id: ws.account },
            { $set: { description: data.value } },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
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

        await Account.deleteOne({ _id: account._id })

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
    resourceId: Joi.string().required(),
    type: Joi.string().required(),
}).unknown(true)

module.exports.follow = async (data, ws) => {
    try {
        const { error } = followAccountSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }
        const { type, resourceId } = data
        const newNotificationId = await getNotificationId()

        await Account.updateOne(
            { _id: ws.account },
            {
                $addToSet: { following: resourceId },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'follow',
                                details: {
                                    accountId: resourceId,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: -20,
                    },
                },
            },
            { useFindAndModify: false }
        )

        await Account.updateOne(
            { _id: resourceId },
            {
                $addToSet: { followers: ws.account },
                $inc: { followersCount: 1 },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'follow',
                                details: {
                                    accountId: resourceId,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: -20,
                    },
                },
            },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.unfollow = async (data, ws) => {
    try {
        const { error } = followAccountSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }
        const { type, resourceId } = data

        await Account.updateOne(
            { _id: ws.account },
            { $pull: { following: resourceId } },
            { useFindAndModify: false }
        )

        await Account.updateOne(
            { _id: resourceId },
            {
                $pull: { followers: ws.account },
                $inc: { followersCount: -1 },
            },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.like = async (data, ws) => {
    try {
        const { error } = followAccountSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }
        const { type, resourceId } = data
        const model = type === 'advice' ? Advice : Board

        await model.updateOne(
            { _id: resourceId },
            {
                $addToSet: { likes: ws.account },
                $inc: { likesCount: 1 },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'like',
                                details: {
                                    [type === 'advice'
                                        ? 'adviceId'
                                        : 'boardId']: resourceId,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: -20,
                    },
                },
            },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.unlike = async (data, ws) => {
    try {
        const { error } = followAccountSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }
        const { type, resourceId } = data
        const model = type === 'advice' ? Advice : Board

        await model.updateOne(
            { _id: resourceId },
            { $pull: { likes: ws.account }, $inc: { likesCount: -1 } },
            { useFindAndModify: false }
        )

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.saveStructure = async (data, ws) => {
    try {
        await Structure.updateOne(
            { _id: data.structureId },
            {
                structure: data.structure,
            },
            { useFindAndModify: false }
        )
        ws.send(
            JSON.stringify({
                messageCode: 'structureSaved',
            })
        )
        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}

module.exports.markSeenNots = async (data, ws) => {
    try {
        console.log(data.ids)
        await Account.updateOne(
            { _id: ws.account },
            {
                $push: {
                    seenNots: {
                        $each: data.ids,
                        $slice: -100,
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
