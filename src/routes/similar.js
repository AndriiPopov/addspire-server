const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const express = require('express')
const getAccount = require('../utils/getAccount')
const { Post } = require('../models/post')
const { Reward } = require('../models/reward')
const { Activity } = require('../models/activity')

const router = express.Router()

router.post('/', async (req, res, next) => {
    try {
        const search = req.body.search
        const model =
            search.type === 'goal'
                ? Progress
                : search.type === 'reward'
                ? Reward
                : Activity
        const resources = await model
            .find({
                category: {
                    $elemMatch: {
                        $in: search.categories,
                    },
                },
                _id: { $ne: search.currentId },
                position: {
                    $near: {
                        $geometry: search.position,
                    },
                },
            })
            .sort('views')
            .limit(10)
            .select('name images')
            .lean()
            .exec()

        res.send({
            resources,
            success: true,
        })
    } catch (ex) {
        console.log(ex)
        res.send({
            success: false,
        })
    }
})

module.exports = router
