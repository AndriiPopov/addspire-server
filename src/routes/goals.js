const auth = require('../middleware/auth')
const authNotForce = require('../middleware/authNotForce')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const express = require('express')
const getAccount = require('../utils/getAccount')
const Joi = require('@hapi/joi')

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

router.get('/:_id/:goalId', authNotForce, async (req, res, next) => {
    try {
        let profile = await Account.findById(req.params._id)
            .select({
                goals: { $elemMatch: { goalId: req.params.goalId } },
                friends: 1,
            })
            .lean()
            .exec()
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name image friends goals',
                false,
                true
            )
        }

        if (profile && profile.goals && profile.goals.length > 0) {
            let friends = profile.friends.map(item => item.friend)
            friends = await Account.find({
                _id: { $in: friends },
            })
                .select('name image')
                .lean()
                .exec()
            res.send({
                account,
                profile: {
                    friendsData: friends,
                },
                goal: profile.goals[0],
                success: true,
            })
        } else {
            res.send({
                account,
                success: false,
            })
        }
    } catch (ex) {}
})

const addGoalSchema = Joi.object({
    id: Joi.string()
        .max(100)
        .allow(''),
    name: Joi.string()
        .min(1)
        .max(100)
        .required(),
    description: Joi.string()
        .min(0)
        .max(500)
        .allow(''),
    images: Joi.array().items(Joi.string()),
    users: Joi.array().items(Joi.string()),
    experts: Joi.array().items(Joi.string()),
    supporters: Joi.array().items(Joi.string()),
    rewardsGroups: Joi.array().items(
        Joi.object({
            key: Joi.string()
                .max(50)
                .required(),
            rewards: Joi.array().items(
                Joi.object({
                    mode: Joi.string()
                        .valid('simple', 'money', 'item')
                        .required(),
                    simple: Joi.string()
                        .min(0)
                        .max(500)
                        .allow(''),
                    money: Joi.number().allow(''),
                    itemName: Joi.string()
                        .min(0)
                        .max(500)
                        .allow(''),
                    itemDescription: Joi.string()
                        .min(0)
                        .max(500)
                        .allow(''),
                    itemImages: Joi.array().items(Joi.string()),
                })
            ),
        })
    ),
    newTabIndex: Joi.number().allow(''),
    withMilestones: Joi.boolean(),
    goalId: Joi.string()
        .max(50)
        .allow(''),
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
