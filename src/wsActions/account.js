const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const getAccount = require('../utils/getAccount')
const { sendSuccess, sendError } = require('./confirm')
const { User } = require('../models/user')

const editAccountSchema = Joi.object({
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),

    name: Joi.string()
        .max(JoiLength.name)
        .required(),
    messageCode: Joi.string().required(),
})

module.exports.editAccount = async (data, ws) => {
    try {
        const { error } = editAccountSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }
        const res = await Account.updateOne(
            { _id: data.accountId },
            { name: data.name }
        )
        if (res.n > 0) {
            sendSuccess(ws)
        } else {
            sendError(ws, 'Something failed.')
        }
    } catch (ex) {
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

        let account = await findById(data.accountId)
            .select('friends progresses __v')
            .lean()
        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }

        const friends = await Account.find({
            _id: { $in: account.friends },
        })
            .select('friends wallet __v')
            .exec()

        for (let friend of friends) {
            friend.friends = friend.friends.filter(
                item => item.friend !== account._id
            )
            friend.wallet = friend.wallet.filter(
                item => item.user !== account._id
            )
            friend.save()
        }

        const progresses = await Progress.find({
            _id: { $in: account.progresses },
        })
            .select('worker owner goal __v')
            .exec()

        for (let progress of progresses) {
            if (progress.owner === account._id) progress.owner = ''
            if (progress.worker === account._id) progress.worker = ''
            progress.goal.supporters = progress.goal.supporters.filter(
                item => item !== account._id
            )
            progress.goal.experts = progress.goal.experts.filter(
                item => item !== account._id
            )
            progress.save()
        }
        Account.findByIdAndDelete(account._id).exec()
        User.findByIdAndDelete(ws.user).exec()

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}
