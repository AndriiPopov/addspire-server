const { User } = require('../models/user')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { Transaction } = require('../models/transaction')

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
            { status: 'cancelled' }
        )
        const buyer = await Account.findById(transaction.to)
            .select('wallet myNotifications notifications __v')
            .exec()
        const seller = await Account.findById(transaction.from)
            .select('wallet myNotifications notifications __v')
            .exec()
        if (buyer && seller) {
            const currency = buyer.wallet.find(
                item => item.user === transaction.from
            )

            currency.amount = currency.amount + transaction.amount

            const newNotificationId = await getNotificationId()
            const notification = {
                user: seller._id,
                code: 'cancel transaction',
                notId: newNotificationId,
                details: {
                    itemName: transaction.item.itemName,
                    itemId: transaction.item.itemId,
                    price: transaction.amount,
                    buyer: buyer._id,
                },
            }

            addNotification(seller, notification, true, true)
            addNotification(buyer, notification, true, true)

            buyer.save()
            seller.save()
            sendSuccess(ws)
        }
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.confirmTransaction = async (data, ws) => {
    try {
        // const { error } = transactionSchema.validate(data)
        // if (error) {
        //     console.log(error)
        //     sendError(ws, 'Bad data!')
        //     return
        // }
        const transaction = await Transaction.findOneAndUpdate(
            { _id: data.id },
            { status: data.status }
        )

        // const buyer = await Account.findById(transaction.to)
        //     .select('myNotifications notifications __v')
        //     .exec()
        // const seller =
        //     transaction.to !== transaction.from
        //         ? await Account.findById(transaction.from)
        //               .select('myNotifications notifications __v')
        //               .exec()
        //         : buyer
        // if (seller && buyer) {
        //     const newNotificationId = await getNotificationId()
        //     const notification = {
        //         user: seller._id,
        //         code: 'confirm transaction',
        //         notId: newNotificationId,
        //         details: {
        //             itemName: transaction.rewardName,
        //             itemId: transaction.reward,
        //             buyer: buyer._id,
        //         },
        //     }

        //     addNotification(seller, notification, true, true)
        //     if (transaction.to !== transaction.from)
        //         addNotification(buyer, notification, true, true)

        //     await buyer.save()
        //     if (transaction.to !== transaction.from) await seller.save()
        // }
        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.deleteTransaction = async (data, ws) => {
    try {
        // const { error } = transactionSchema.validate(data)
        // if (error) {
        //     console.log(error)
        //     sendError(ws, 'Bad data!')
        //     return
        // }
        await Account.updateOne(
            { _id: data.accountId },
            {
                $pull: {
                    transactions: data.id,
                },
            }
        )

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}
