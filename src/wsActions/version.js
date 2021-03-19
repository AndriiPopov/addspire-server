const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')
const mongoose = require('mongoose')

const { sendError, sendSuccess } = require('./confirm')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { Advice } = require('../models/advice')
const { Community } = require('../models/community')
const { Account } = require('../models/account')
const { Post } = require('../models/post')
const getModelFromType = require('../utils/getModelFromType')

module.exports.createNewAdvice = async (data, ws) => {
    try {
        const { value, communityId, comment } = data

        const advice = new Advice({
            owner: ws.account,
            collaborators: [ws.account],
            name: value.name,
            image: value.images.length ? value.images[0] : '',
            images: value.images,
            steps: value.steps,
            owner: ws.account,
            description: value.description,
            shortDescription: value.shortDescription,
            community: communityId,
        })
        const editId = mongoose.Types.ObjectId()

        const post = new Post({
            messages: [
                {
                    messageType: 'suggestedEdit',
                    author: ws.account,
                    details: {
                        editId,
                        resourceId: communityId,
                        resourceType: 'community',
                        communityId,
                    },
                },
                ...(comment
                    ? [
                          {
                              messageType: 'text',
                              author: ws.account,
                              text: comment,
                          },
                      ]
                    : []),
            ],
            users: [ws.account],
        })

        await post.save()

        await advice.save()

        await Community.updateOne(
            { _id: communityId },
            {
                $push: {
                    suggestedChanges: {
                        suggested: ws.account,
                        action: 'add',
                        key: 'advice',
                        resourceId: communityId,
                        value: advice._id,
                        resourceType: 'community',
                        comment,
                        _id: editId,
                        post: post._id,
                    },
                    posts: post._id,
                },
                $inc: { suggestedChangesCount: 1 },
            },
            { useFindAndModify: false }
        )

        // const newNotificationId = await getNotificationId()
        // await Account.findOneAndUpdate(
        //     { _id: ws.account },
        //     {
        //         $push: {
        //             sadmin: advice._id,
        //             notifications: {
        //                 $each: [
        //                     {
        //                         user: ws.account,
        //                         code: 'create new advice',
        //                         details: {
        //                             adviceId: advice._id,
        //                         },
        //                         notId: newNotificationId,
        //                     },
        //                 ],
        //                 $slice: -20,
        //             },
        //         },
        //     },
        //     { useFindAndModify: false }
        // )

        sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.addAdmin = async (data, ws) => {
    try {
        const { resourceId, type, userId } = data
        const model = getModelFromType(type)
        if (model) {
            await model.updateOne(
                { _id: resourceId },
                {
                    $addToSet: { admins: userId },
                },
                { useFindAndModify: false }
            )
            sendSuccess(ws, 'The new Advice is created')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
module.exports.deleteAdmin = async (data, type, ws) => {
    try {
        const { resourceId, type, userId } = data
        const model = getModelFromType(type)
        if (model && userId !== ws.account) {
            await model.updateOne(
                { _id: resourceId },
                { $pull: { admins: userId, sadmins: userId } },
                { useFindAndModify: false }
            )
            sendSuccess(ws, 'The new Advice is created')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
module.exports.setSAdmin = async (data, ws) => {
    try {
        const { resourceId, type, userId, add } = data
        const model = getModelFromType(type)
        if (model && userId !== ws.account) {
            await Advice.updateOne(
                { _id: resourceId },
                {
                    $pull: { [add ? 'admins' : 'sadmins']: userId },
                    $addToSet: {
                        [add ? 'sadmins' : 'admins']: userId,
                    },
                },
                { useFindAndModify: false }
            )

            sendSuccess(ws, 'The new Advice is created')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
