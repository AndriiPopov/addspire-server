const { Account } = require('../models/account')

const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const findMessage = require('../utils/findMessage')
const { sendError } = require('./confirm')
const { Post } = require('../models/post')
const { Progress } = require('../models/progress')
const { Group } = require('../models/group')

const sendMessageSchema = Joi.object({
    postId: Joi.string()
        .max(JoiLength.progressId)
        .required(),
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),
    messageValue: Joi.string()
        .max(JoiLength.description)
        .allow(''),
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
                text: data.imageUrl || data.messageValue,
                action: data.imageUrl ? 'image' : 'message',
                messageId: post.currentId,
            })
            post.currentId = post.currentId + 1
        } else if (data.editedMessage) {
            const message = findMessage(post.messages, data.editedMessage)

            if (message) {
                message.text = data.imageUrl || data.messageValue
                message.action = data.imageUrl ? 'image' : 'message'
                message.editedDate = Date.now()
            }
        } else if (data.replyToMessage) {
            const message = findMessage(post.messages, data.replyToMessage)

            if (message) {
                message.replies.push({
                    author: data.accountId,
                    text: data.imageUrl || data.messageValue,
                    action: data.imageUrl ? 'image' : 'message',
                    messageId: post.currentId,
                    image: '',
                    date: Date.now(),
                    editedDate: Date.now(),
                    likes: [],
                    dislikes: [],
                    replies: [],
                })
                post.currentId = post.currentId + 1
            }
        }

        if (!account.followPosts.includes(post._id.toString())) {
            account.followPosts.push(post._id.toString())
            account.save()
        }

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
                    }
                    break
                case 'dislikeMessage':
                    message.likes = message.likes.filter(
                        item => item !== data.accountId
                    )
                    break
            }
            if (!account.followPosts.includes(post._id.toString())) {
                account.followPosts.push(post._id.toString())
                account.save()
            }
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
    parentType: Joi.string()
        .valid('progress', 'group')
        .required(),
    accountId: Joi.string()
        .max(JoiLength.name)
        .required(),
    messageValue: Joi.string()
        .max(JoiLength.description)
        .allow(''),
}).unknown(true)

module.exports.addPost = async (data, ws) => {
    try {
        const { error } = addPostSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }
        const parent =
            data.parentType === 'progress'
                ? await Progress.findById(data.parentId)
                      .select('posts __v')
                      .exec()
                : await Group.findById(data.parentId)
                      .select('posts __v')
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
                text: data.imageUrl || data.messageValue,
                action: data.imageUrl ? 'image' : 'message',
                messageId: '0',
                image: '',
                date: Date.now(),
                editedDate: Date.now(),
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
