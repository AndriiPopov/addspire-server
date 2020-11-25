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
        // const { error } = findProgressesSchema.validate(req.body)

        // if (error) {
        //     console.log(error)
        //     resSendError(res, 'Bad data!')
        //     return
        // }

        const search = req.body.value

        const query = {}
        let isSearch
        if (search.withMap) {
            query.position = {
                $geoWithin: {
                    $centerSphere: [
                        [search.position[1], search.position[0]],
                        search.distance / (search.units === 'mi' ? 3963 : 6377),
                    ],
                },
            }
            isSearch = true
        }
        if (search.value) {
            query.name = new RegExp(search.value, 'gi')
            isSearch = true
        }
        if (search.categories.length > 0) {
            query.category = {
                $elemMatch: {
                    $in: search.categories,
                },
            }
            isSearch = true
        }
        const progresses = await Progress.find(isSearch ? query : undefined)
            .sort('views')
            .skip(req.body.skip)
            .limit(20)
            .select('__v owner name images users views')
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
            .limit(20)
            .select('__v owner name images users views')
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

module.exports = router
