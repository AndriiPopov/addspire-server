const { Account } = require('../models/account')

const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const findMessage = require('../utils/findMessage')
const { sendError } = require('./confirm')
const { Post } = require('../models/post')
const { Progress } = require('../models/progress')
const addNotification = require('../utils/addNotification')
const { Reward } = require('../models/reward')
const { Activity } = require('../models/activity')

const sendMessageSchema = Joi.object({
    postId: Joi.string()
        .max(JoiLength.progressId)
        .required(),
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),
    messageValue: Joi.any(),
}).unknown(true)

module.exports.sendMessage = async (data, ws) => {
    try {
        const { error } = sendMessageSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const post = await Post.findById(data.postId)
        const account = await Account.findById(data.accountId)
            .select('followPosts __v')
            .exec()

        if (!post || !account) {
            sendError(ws, 'Bad data!')
            return
        }
        if (!data.editedMessage && !data.replyToMessage) {
            post.messages.push({
                author: data.accountId,
                text: data.messageValue,
                image: data.image,
                action: data.imageUrl ? 'image' : 'message',
                messageId: post.currentId,
            })
            post.currentId = post.currentId + 1
            addNotification(post, {
                user: data.accountId,
                code: 'comment',
            })
        } else if (data.editedMessage) {
            const message = findMessage(post.messages, data.editedMessage)

            if (message) {
                message.text = data.messageValue
                message.image = data.image
                message.action = data.imageUrl ? 'image' : 'message'
                message.editedDate = Date.now()
            }
            addNotification(post, {
                user: message.author,
                code: 'edit comment',
            })
        } else if (data.replyToMessage) {
            const message = findMessage(post.messages, data.replyToMessage)

            if (message) {
                message.replies.push({
                    author: data.accountId,
                    text: data.messageValue,
                    image: data.image,
                    action: data.imageUrl ? 'image' : 'message',
                    messageId: post.currentId,
                    image: '',
                    date: Date.now(),
                    editedDate: Date.now(),
                    likes: [],
                    dislikes: [],
                    replies: [],
                })
                addNotification(post, {
                    user: data.accountId,
                    code: 'comment',
                })
                post.currentId = post.currentId + 1
            }
        }

        if (!account.followPosts.includes(post._id.toString())) {
            account.followPosts.push(post._id.toString())
            account.save()
        }
        if (!post.users.includes(account._id)) post.users.push(account._id)
        post.save()
        ws.send(
            JSON.stringify({
                messageCode: 'messageSaved',
            })
        )
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.changeLikesMessage = async (data, ws) => {
    try {
        if (data.messageId && data.postId) {
            const post = await Post.findById(data.postId)
            const account = await Account.findById(data.accountId)
                .select('followPosts __v')
                .exec()

            let message
            if (data.messageId.toString() === '0') message = post.startMessage
            else message = findMessage(post.messages, data.messageId)

            if (!post || !account || !message) {
                sendError(ws, 'Bad data!')
                return
            }

            switch (data.messageCode) {
                case 'likeMessage':
                    if (message.likes.indexOf(data.accountId) === -1) {
                        message.likes.push(data.accountId)
                        addNotification(post, {
                            user: data.accountId,
                            code: 'like',
                        })
                    }
                    break
                case 'dislikeMessage':
                    message.likes = message.likes.filter(
                        item => item !== data.accountId
                    )
                    addNotification(post, {
                        user: data.accountId,
                        code: 'dislike',
                    })
                    break
            }
            if (!account.followPosts.includes(post._id.toString())) {
                account.followPosts.push(post._id.toString())
                account.save()
            }
            if (!post.users.includes(account._id)) post.users.push(account._id)
            post.save()
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

const addPostSchema = Joi.object({
    parentId: Joi.string()
        .max(JoiLength.progressId)
        .required(),
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),
    messageValue: Joi.any(),
}).unknown(true)

module.exports.addPost = async (data, ws) => {
    try {
        const { error } = addPostSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }
        const model =
            data.parentType === 'goal'
                ? Progress
                : data.parentType === 'reward'
                ? Reward
                : Activity
        const parent = await model
            .findById(data.parentId)
            .select('posts notifications __v')
            .exec()

        const account = await Account.findById(data.accountId)
            .select('followPosts __v')
            .exec()

        if (!parent || !account) {
            sendError(ws, 'Bad data!')
            return
        }

        const post = new Post({
            users: [data.accountId],
            startMessage: {
                author: data.accountId,
                text: data.messageValue,
                image: data.images,
                action: 'message',
                messageId: '0',
                date: Date.now(),
                editedDate: Date.now(),
            },
            parent: { parentId: parent._id, parentType: data.parentType },
        })

        post.notifications = [
            {
                user: data.accountId,
                code: 'add post',
                details: {
                    postId: post._id,
                },
            },
        ]

        addNotification(parent, {
            user: data.accountId,
            code: 'add post',
            details: {
                postId: post._id,
            },
        })

        post.save()

        account.followPosts.push(post._id.toString())
        account.save()

        parent.posts.push(post._id.toString())
        parent.save()

        ws.send(
            JSON.stringify({
                messageCode: 'postAdded',
            })
        )
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

const editPostSchema = Joi.object({
    postId: Joi.string()
        .max(JoiLength.progressId)
        .required(),
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),
    messageValue: Joi.any(),
}).unknown(true)

module.exports.editPost = async (data, ws) => {
    try {
        const { error } = editPostSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }
        const post = await Post.findById(data.postId)
            .select('startMessage notifications __v')
            .exec()

        if (!post || data.accountId !== post.startMessage.author) {
            sendError(ws, 'Bad data!')
            return
        }

        post.startMessage.text = data.messageValue
        post.startMessage.image = data.images

        addNotification(post, {
            user: data.accountId,
            code: 'edit post',
        })
        post.markModified('startMessage.text')
        await post.save()

        ws.send(
            JSON.stringify({
                messageCode: 'postEdited',
            })
        )
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

const deletePostSchema = Joi.object({
    postId: Joi.string()
        .max(JoiLength.progressId)
        .required(),
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),
}).unknown(true)

module.exports.deletePost = async (data, ws) => {
    try {
        const { error } = deletePostSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }
        const { postId } = data
        const post = await Post.findOneAndDelete(
            { _id: postId },
            {
                projection: {
                    users: 1,
                    parent: 1,
                },
            }
        )

        if (post) {
            await Account.updateMany(
                {
                    _id: {
                        $in: post.users,
                    },
                },
                {
                    $pull: {
                        posts: postId,
                    },
                },
                { useFindAndModify: false }
            )

            const model =
                post.parent.parentType === 'goal'
                    ? Progress
                    : post.parent.parentType === 'reward'
                    ? Reward
                    : Activity
            await model.updateOne(
                {
                    _id: post.parent.parentId,
                },
                {
                    $pull: {
                        posts: postId,
                    },
                },
                { useFindAndModify: false }
            )
        }

        ws.send(
            JSON.stringify({
                messageCode: 'postDeleted',
            })
        )
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

const deleteMessageSchema = Joi.object({
    postId: Joi.string()
        .max(JoiLength.progressId)
        .required(),
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),
}).unknown(true)
