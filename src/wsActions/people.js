const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')
const mongoose = require('mongoose')

const { sendError, sendSuccess } = require('./confirm')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { Community } = require('../models/community')
const { Account } = require('../models/account')
const { Post } = require('../models/post')
const getModelFromType = require('../utils/getModelFromType')
const { People } = require('../models/people')

module.exports.createPeople = async (data, ws) => {
    try {
        const { value, communityId, comment } = data

        const people = new People({
            owner: ws.account,
            collaborators: [ws.account],
            name: value.name,
            image: value.images.length ? value.images[0] : '',
            images: value.images,
            link: value.link,
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

        await people.save()

        await Community.updateOne(
            { _id: communityId },
            {
                $push: {
                    suggestedChanges: {
                        suggested: ws.account,
                        action: 'add',
                        key: 'people',
                        resourceId: communityId,
                        value: people._id,
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
