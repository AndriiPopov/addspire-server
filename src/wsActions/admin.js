const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')
const mongoose = require('mongoose')

const { sendError, sendSuccess } = require('./confirm')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { Account } = require('../models/account')
const { Post } = require('../models/post')
const getModelFromType = require('../utils/getModelFromType')

module.exports.addAdmin = async (data, ws) => {
    try {
        const { resourceId, type, userId } = data
        const model = getModelFromType(type)
        if (model) {
            await model.updateOne(
                { _id: resourceId },
                {
                    $addToSet: { admins: userId },
                },
                { useFindAndModify: false }
            )
            await Account.updateOne(
                { _id: ws.account },
                {
                    $addToSet: {
                        admin: { item: resourceId, itemType: type },
                    },
                },
                { useFindAndModify: false }
            )
            sendSuccess(ws, 'The new Advice is created')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
module.exports.deleteAdmin = async (data, ws) => {
    try {
        const { resourceId, type, userId } = data
        const model = getModelFromType(type)
        if (model && userId !== ws.account) {
            await model.updateOne(
                { _id: resourceId },
                { $pull: { admins: userId, sadmins: userId } },
                { useFindAndModify: false }
            )
            await Account.updateOne(
                { _id: ws.account },
                {
                    $pull: {
                        admin: { item: resourceId, itemType: type },
                    },
                },
                { useFindAndModify: false }
            )
            sendSuccess(ws, 'The new Advice is created')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
module.exports.setSAdmin = async (data, ws) => {
    try {
        const { resourceId, type, userId, add } = data
        const model = getModelFromType(type)
        if (model && userId !== ws.account) {
            await model.updateOne(
                { _id: resourceId },
                {
                    $pull: { [add ? 'admins' : 'sadmins']: userId },
                    $addToSet: {
                        [add ? 'sadmins' : 'admins']: userId,
                    },
                },
                { useFindAndModify: false }
            )

            await Account.updateOne(
                { _id: ws.account },
                {
                    $pull: {
                        [add ? 'admin' : 'sadmin']: {
                            item: resourceId,
                            itemType: type,
                        },
                    },
                    $addToSet: {
                        [add ? 'sadmin' : 'admin']: {
                            item: resourceId,
                            itemType: type,
                        },
                    },
                },
                { useFindAndModify: false }
            )

            sendSuccess(ws, 'The new Advice is created')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
