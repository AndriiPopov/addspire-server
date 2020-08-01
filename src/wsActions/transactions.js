const { User } = require('../models/user')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')

const transactionSchema = Joi.object({
    id: Joi.string()
        .max(JoiLength.id)
        .allow(''),
    accountId: Joi.string().required(),
}).unknown(true)

module.exports.cancelTransaction = async (data, ws) => {
    try {
        const { error } = transactionSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: data.id },
            { status: 'Cancelled' }
        )
        const buyer = await Account.findById(transaction.to)
            .select('wallet __v')
            .exec()

        const currency = buyer.wallet.find(
            item => item.user === transaction.from
        )

        currency.amount = currency.amount + transaction.amount

        buyer.save()
        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.confirmTransaction = async (data, ws) => {
    try {
        const { error } = transactionSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: data.id },
            { status: 'Confirmed' }
        )

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}
