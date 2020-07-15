const auth = require('../middleware/auth')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const express = require('express')
const Joi = require('@hapi/joi')
const { resSendError } = require('../utils/resError')
const { JoiLength } = require('../constants/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)
const router = express.Router()

const activateAccountSchema = Joi.object({
    nickname: Joi.string()
        .min(2)
        .max(JoiLength.name)
        .regex(new RegExp(/^[a-zA-Z0-9_-]*$/))
        .required(),
    name: Joi.string()
        .min(2)
        .max(JoiLength.name - 1)
        .required(),
})

router.post('/', auth, async (req, res, next) => {
    try {
        const data = req.body
        const { error } = activateAccountSchema.validate(data)
        if (error) {
            console.log(error)
            resSendError(res, 'bad data')
            return
        }

        const _id = data.nickname.toLowerCase()
        const nicknameNotUnique = await Account.count({ _id })
        if (nicknameNotUnique > 0) {
            res.send({
                nicknameNotUnique: true,
            })
            return
        }
        let account = new Account({
            _id,
            name: data.name,
            status: 'activated',
        })

        await account.save()

        req.user.myAccount = account._id
        req.user.currentAccount = account._id
        req.user.save()

        res.send({
            success: true,
        })
    } catch (ex) {
        console.log(ex)
    }
})

module.exports = router
