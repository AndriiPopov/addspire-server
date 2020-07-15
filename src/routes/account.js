const auth = require('../middleware/auth')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const express = require('express')
const getAccount = require('../utils/getAccount')
const { Progress } = require('../models/progress')
const Joi = require('@hapi/joi')
const { resSendError } = require('../utils/resError')
const { JoiLength } = require('../constants/fieldLength')

const router = express.Router()

router.get('/', auth, async (req, res, next) => {
    try {
        let account = await getAccount(req, res, 'name image')
        if (!account) return

        res.send({
            account,
        })
    } catch (ex) {}
})

const changeAccountSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(JoiLength.name)
        .required(),
})

router.post('/', auth, async (req, res, next) => {
    try {
        const data = req.body
        const { error } = changeAccountSchema.validate(data)
        if (error) {
            resSendError(res, 'bad data')
            return
        }
        let account = await getAccount(req, res, 'name image', true)
        if (!account) return

        account.name = req.body.name
        account.save()

        res.send({
            success: true,
            successCode: 'success',
        })
    } catch (ex) {}
})

const deleteAccountSchema = Joi.object({
    accountId: Joi.string().required(),
})

router.post('/delete', auth, async (req, res, next) => {
    try {
        const data = req.body
        const { error } = deleteAccountSchema.validate(data)
        if (error) {
            resSendError(res, 'bad data')
            return
        }

        let account = await getAccount(req, res, 'friends progresses')
        if (!account) return

        if (account._id === req.body.accountId) {
            let friends = account.friends
                .filter(item => item.status === 'friend')
                .map(item => item.friend)
            friends = await Account.find({
                _id: { $in: friends },
            })
                .select('friends wallet')
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

            let progresses = account.progresses
            progresses = await Progress.find({
                _id: { $in: progresses },
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
            User.findByIdAndDelete(req.user._id).exec()

            res.send({
                success: true,
            })
        }
    } catch (ex) {
        console.log(ex)
    }
})

module.exports = router
