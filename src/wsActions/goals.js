const { User } = require('../models/user')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')
const { Post } = require('../models/post')
const { Group } = require('../models/group')
const { Progress } = require('../models/progress')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')

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
            .select('goals currentId myPosts notifications __v')
            .exec()
        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }
        let itemId = data.id
        const newNotificationId = await getNotificationId()

        if (itemId) {
            let postId
            account.goals = account.toObject().goals.map(item => {
                if (item.itemId === itemId) {
                    postId = item.post
                    return { ...item, ...data.value }
                } else return item
            })
            const newNotificationIdPost = await getNotificationId()

            await Post.findOneAndUpdate(
                { _id: postId },
                {
                    $set: {
                        startMessage: {
                            author: account._id,
                            text: data.value.description,
                            action: 'edit goal',
                            image: data.value.images,
                            messageId: '0',
                            messageType: 'goal',
                            details: {
                                owner: account._id,
                                name: data.value.name,
                                itemId,
                            },
                        },
                    },
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: account._id,
                                    code: 'edit goal',
                                    notId: newNotificationIdPost,
                                    details: {
                                        itemId,
                                    },
                                },
                            ],
                            $position: 0,
                            $slice: 20,
                        },
                    },
                },
                { useFindAndModify: false }
            )
            addNotification(account, {
                user: account._id,
                code: 'edit goal',
                notId: newNotificationId,
                details: {
                    itemId,
                    itemName: data.value.name,
                },
            })
        } else {
            itemId = 'wishlistItem_' + account.currentId
            const post = new Post({
                users: [account._id],
                parent: account._id,
                startMessage: {
                    author: account._id,
                    text: data.value.description,
                    action: 'add goal',
                    image: data.value.images,
                    messageId: '0',
                    messageType: 'goal',
                    details: {
                        owner: account._id,
                        name: data.value.name,
                        itemId,
                    },
                },
            })
            post.save()
            account.myPosts.push(post._id.toString())
            addNotification(account, {
                user: account._id,
                code: 'add goal',
                notId: newNotificationId,
                details: {
                    itemName: data.value.name,
                    itemId,
                },
            })
            account.currentId = account.currentId + 1
            account.goals = [
                { itemId, ...data.value, post: post._id },
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
            .select('goals notifications myPosts  __v')
            .exec()

        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }
        const itemId = data.id
        let postId
        let itemName = ''
        if (itemId) {
            account.goals = account.toObject().goals.filter(goal => {
                if (goal.itemId !== itemId) {
                    return true
                } else {
                    itemName = item.name
                    postId = goal.post
                    return false
                }
            })
        }
        if (postId)
            account.myPosts.filter(
                item => item.toString() !== postId.toString()
            )

        const newNotificationId = await getNotificationId()
        addNotification(account, {
            user: account._id,
            code: 'delete goal',
            notId: newNotificationId,
            details: {
                itemName,
            },
        })
        account.save()

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}
