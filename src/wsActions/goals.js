const { User } = require('../models/user')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')
const { Post } = require('../models/post')
const { Group } = require('../models/group')
const { Progress } = require('../models/progress')

const startProgressSchema = Joi.object({
    itemId: Joi.string().required(),
    ownerId: Joi.string().required(),
    workerId: Joi.string().required(),
}).unknown(true)

const saveGoalSchema = Joi.object({
    id: Joi.string()
        .max(JoiLength.id)
        .allow(''),
    value: Joi.object({
        name: Joi.string()
            .min(1)
            .max(JoiLength.name)
            .required(),
        description: Joi.string()
            .min(0)
            .max(JoiLength.description)
            .allow(''),
        images: Joi.array().items(Joi.string()),
    }),
    accountId: Joi.string().required(),
}).unknown(true)

module.exports.saveGoal = async (data, ws) => {
    try {
        const { error } = saveGoalSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.accountId)
            .select('goals currentId followPosts __v')
            .exec()
        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }
        let itemId = data.id
        if (itemId) {
            account.goals = account.toObject().goals.map(item => {
                if (item.itemId === itemId) return { ...item, ...data.value }
                else return item
            })
        } else {
            const post = new Post({
                users: [account._id],
            })
            post.save()
            account.followPosts.push(post._id.toString())
            itemId = 'goal_' + account.currentId
            account.currentId = account.currentId + 1
            account.goals = [
                { itemId: itemId, ...data.value, post: post._id },
                ...account.goals,
            ]
        }
        account.save()
        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}

const deleteGoalSchema = Joi.object({
    accountId: Joi.string().required(),
    id: Joi.string().required(),
}).unknown(true)

module.exports.deleteGoal = async (data, ws) => {
    try {
        const { error } = deleteGoalSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.accountId)
            .select('goals followPosts  __v')
            .exec()

        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }
        const itemId = data.id
        let postId
        if (itemId) {
            account.goals = account.toObject().goals.filter(goal => {
                if (goal.itemId !== itemId) {
                    return true
                } else {
                    postId = goal.post
                    return false
                }
            })
        }
        if (postId)
            account.followPosts.filter(
                item => item.toString() !== postId.toString()
            )
        account.save()

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}
