const auth = require('../middleware/auth')
const authNotForce = require('../middleware/authNotForce')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const express = require('express')
const getAccount = require('../utils/getAccount')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')
const { resSendError } = require('../utils/resError')
const { Post } = require('../models/post')

const router = express.Router()

router.get('/', auth, async (req, res, next) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(req, res, 'name friends goals')
        }
        let friends = account.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image goals')
            .lean()
            .exec()

        res.send({
            account: {
                ...account,
                friendsData: friends,
            },
            success: true,
        })
    } catch (ex) {}
})

router.get('/:_id/:itemId', authNotForce, async (req, res, next) => {
    try {
        let profile = await Account.findById(req.params._id)
            .select({
                goals: { $elemMatch: { itemId: req.params.itemId } },
                name: 1,
                image: 1,
            })
            .lean()
            .exec()
        if (profile && profile.goals && profile.goals.length > 0) {
            const goal = profile.goals[0]
            if (goal.post.length > 0) {
                const post = await Post.findById(goal.post[0])
                    .lean()
                    .exec()
                if (post) {
                    const friendData = await Account.find({
                        _id: { $in: post.users },
                    })
                        .select('name image ')
                        .lean()
                        .exec()

                    res.send({
                        goal,
                        profile,
                        post,
                        friendData,
                        success: true,
                    })
                    return
                }
            }
        }
        res.send({
            account,
            success: false,
        })
    } catch (ex) {}
})

const addGoalSchema = Joi.object({
    goalId: Joi.string()
        .max(JoiLength.id)
        .allow(''),
    accountId: Joi.string().required(),
    value: Joi.object({
        name: Joi.string()
            .min(1)
            .max(JoiLength.name)
            .required(),
        description: Joi.string()
            .min(0)
            .max(JoiLength.description)
            .allow(''),
    }),
}).unknown(true)

router.post('/add', auth, async (req, res) => {
    try {
        const data = req.body
        const { error } = addGoalSchema.validate({
            ...data.value,
            id: data.id,
        })
        if (error) {
            console.log(error)
            resSendError(res, 'bad data')
            return
        }
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name friends goals currentId',
                true
            )
        }
        let goalId = data.id
        if (goalId) {
            account.goals = account.toObject().goals.map(goal => {
                if (goal.goalId === goalId) return { ...goal, ...data.value }
                else return goal
            })
        } else {
            goalId = 'goal_' + account.currentId
            account.currentId = account.currentId + 1
            account.goals = [{ goalId, ...data.value }, ...account.goals]
        }
        account.save()
        let friends = account.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image goals')
            .lean()
            .exec()
        res.send({
            account: {
                ...account.toObject(),
                friendsData: friends,
            },
            success: true,
            successCode: 'goal saved',
        })
    } catch (ex) {}
})

router.post('/delete/:id', auth, async (req, res) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name friends goals currentId',
                true
            )
        }
        const goalId = req.params.id
        if (goalId) {
            account.goals = account
                .toObject()
                .goals.filter(goal => goal.goalId !== goalId)
        }
        account.save()
        let friends = account.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image goals')
            .lean()
            .exec()
        res.send({
            account: {
                ...account.toObject(),
                friendsData: friends,
            },
            success: true,
            successCode: 'goal deleted',
        })
    } catch (ex) {}
})

module.exports = router
