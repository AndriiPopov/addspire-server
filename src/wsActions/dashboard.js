const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const getAccount = require('../utils/getAccount')
const { sendSuccess, sendError } = require('./confirm')

const setLastSeenNotSchema = Joi.object({
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),

    notId: Joi.number().required(),
    messageCode: Joi.string().required(),
})

module.exports.setLastSeenNot = async (data, ws) => {
    try {
        const { error } = setLastSeenNotSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }
        await Account.updateOne(
            { _id: data.accountId },
            { lastSeenNot: data.notId }
        )
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}
