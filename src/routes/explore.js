const express = require('express')
const { resSendError } = require('../utils/resError')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const router = express.Router()

const findProgressesSchema = Joi.object({
    value: Joi.string().max(JoiLength.name),
    skip: Joi.number(),
}).unknown(true)

router.post('/search', async (req, res, next) => {
    try {
        const { error } = findProgressesSchema.validate(req.body)

        if (error) {
            console.log(error)
            resSendError(res, 'Bad data!')
            return
        }

        const progresses = await Progress.find({
            name: new RegExp(req.body.value, 'gi'),
        })
            .skip(req.body.skip)
            .limit(20)
            .select('__v owner name goal.images goal.users')
            .lean()
            .exec()

        let friends = progresses.map(item => item.owner)

        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image')
            .lean()
            .exec()

        res.send({
            progresses,
            friends,
            success: true,
            noMore: progresses.length < 20,
        })
    } catch (ex) {}
})

const findPopularSchema = Joi.object({
    skip: Joi.number(),
}).unknown(true)

router.post('/popular', async (req, res, next) => {
    try {
        const { error } = findPopularSchema.validate(req.body)

        if (error) {
            console.log(error)
            resSendError(res, 'Bad data!')
            return
        }

        const progresses = await Progress.find()
            .sort('views')
            .skip(req.body.skip)
            .limit(4)
            .select('__v owner name goal.images goal.users')
            .lean()
            .exec()

        let friends = progresses.map(item => item.owner)

        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image')
            .lean()
            .exec()

        res.send({
            progresses,
            friends,
            success: true,
            noMore: progresses.length < 4,
        })
    } catch (ex) {}
})

module.exports = router
