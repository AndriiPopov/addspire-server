const { Account } = require('../models/account')

const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const findMessage = require('../utils/findMessage')
const { sendError } = require('./confirm')
const { Post } = require('../models/post')
const addNotification = require('../utils/addNotification')
const { Board } = require('../models/board')
const { Advice } = require('../models/advice')
const { Community } = require('../models/community')
const getModelFromType = require('../utils/getModelFromType')

const sendMessageSchema = Joi.object({
    postId: Joi.string()
        .max(JoiLength.progressId)
        .required(),

    // messageValue: Joi.any(),
}).unknown(true)

module.exports.sendMessage = async (data, ws) => {
    try {
        const { error } = sendMessageSchema.validate(data)
        if (error || (!data.messageValue && !data?.image?.length)) {
            console.log(error)
            console.log(data)
            sendError(ws, 'Bad data!')
            return
        }

        let edits = {}
        let query = {}
        if (!data.editedMessage && !data.replyToMessage) {
            edits = {
                $push: {
                    messages: {
                        author: ws.account,
                        text: data.messageValue,
                        image: data.image,
                        action: data.imageUrl ? 'image' : 'message',
                    },
                },
            }
        } else if (data.editedMessage) {
            query = data.isReply
                ? {
                      'messages.replies._id': data.editedMessage,
                  }
                : {
                      'messages._id': data.editedMessage,
                  }
            edits = {
                $set: {
                    'messages.$.text': data.messageValue,
                    'messages.$.image': data.image,
                    'messages.$.action': data.imageUrl ? 'image' : 'message',
                    'messages.$.editedDate': Date.now(),
                },
            }
        } else if (data.replyToMessage) {
            query = {
                'messages._id': data.replyToMessage,
            }
            edits = {
                $push: {
                    'messages.$.replies': {
                        author: ws.account,
                        text: data.messageValue,
                        image: data.image,
                        action: data.imageUrl ? 'image' : 'message',
                        image: '',
                        date: Date.now(),
                        editedDate: Date.now(),
                        likes: [],
                        dislikes: [],
                        replies: [],
                    },
                },
            }
        }
        await Post.updateOne(
            {
                _id: data.postId,
                ...query,
            },
            edits,
            { useFindAndModify: false }
        )
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
        if (data._id && data.postId) {
            await Post.updateOne(
                {
                    _id: data.postId,
                    'messages._id': data._id,
                },
                {
                    ...(data.messageCode === 'likeMessage'
                        ? {
                              $addToSet: {
                                  'messages.$.likes': ws.account,
                                  users: ws.account,
                              },
                          }
                        : {
                              $pull: {
                                  'messages.$.likes': ws.account,
                              },
                          }),
                },
                { useFindAndModify: false }
            )
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

    messageValue: Joi.any(),
}).unknown(true)

module.exports.addPost = async (data, ws) => {
    try {
        const { error } = addPostSchema.validate(data)
        if (error) {
            sendError(ws, 'Bad data!')
            return
        }
        const model = getModelFromType(data.parentType)

        const post = new Post({
            users: [ws.account],
            messages: [
                {
                    author: ws.account,
                    text: data.messageValue,
                    image: data.images,
                    action: 'message',
                    date: Date.now(),
                    editedDate: Date.now(),
                },
            ],
            parent: {
                parentId: data.parentId,
                parentType: data.parentType,
                progressId: data.progressId,
            },
        })

        post.save()
        if (model)
            await model.updateOne(
                { _id: data.parentId },
                { $push: { posts: post._id } },
                { useFindAndModify: false }
            )

        if (data.parentType !== 'community') {
            await Community.updateOne(
                { _id: data.communityId },
                { $push: { posts: post._id } },
                { useFindAndModify: false }
            )
        }

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
        await Post.updateOne(
            {
                _id: data.postId,
            },
            {
                $set: {
                    'messages.0.text': data.messageValue,
                    'messages.0.image': data.images,
                },
            },
            { useFindAndModify: false }
        )

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
}).unknown(true)

module.exports.deletePost = async (data, ws) => {
    try {
        const { error } = deletePostSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }
        const { postId, communityId, resourceId, resourceType } = data
        await Post.deleteOne({ _id: postId })

        await Community.updateOne(
            {
                _id: communityId,
            },
            {
                $pull: {
                    posts: postId,
                },
            },
            { useFindAndModify: false }
        )

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
}).unknown(true)
