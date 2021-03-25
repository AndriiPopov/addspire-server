const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const mongoose = require('mongoose')
const { sendError, sendSuccess } = require('./confirm')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { Account } = require('../models/account')
const { Community } = require('../models/community')
const { Advice } = require('../models/advice')
const arrayMove = require('array-move')
const { Post } = require('../models/post')
const getModelFromType = require('../utils/getModelFromType')

// function arraymove(arr, fromIndex, toIndex) {
//     var element = arr[fromIndex]
//     arr.splice(fromIndex, 1)
//     arr.splice(toIndex, 0, element)
// }

module.exports.addSuggestedChange = (data, ws) => {
    if (data.resourceType === 'step') addSuggestedChangeStep(data, ws)
    else addSuggestedChangeResource(data, ws)
}
const addSuggestedChangeResource = async (data, ws) => {
    try {
        const {
            resourceId,
            resourceType,
            key,
            action,
            comment,
            value,
            details,
        } = data

        const newNotificationId = await getNotificationId()

        const model = getModelFromType(resourceType)

        if (model) {
            const editId = mongoose.Types.ObjectId()
            const post = new Post({
                messages: [
                    {
                        messageType: 'suggestedEdit',
                        author: ws.account,
                        details: {
                            editId,
                            resourceId,
                            resourceType,
                            communityId: details.communityId,
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

            await model.updateOne(
                { _id: resourceId },
                {
                    $push: {
                        suggestedChanges: {
                            suggested: ws.account,
                            action,
                            key,
                            resourceId,
                            value,
                            resourceType,
                            details,
                            _id: editId,
                            post: post._id,
                        },
                        posts: post._id,
                    },
                    $inc: { suggestedChangesCount: 1 },
                },
                { useFindAndModify: false }
            )
            if (resourceType !== 'community')
                await Community.updateOne(
                    { _id: details.communityId },
                    {
                        $push: {
                            posts: post._id,
                        },
                    },
                    { useFindAndModify: false }
                )
            sendSuccess(ws, 'The new Community is created')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

const addSuggestedChangeStep = async (data, ws) => {
    try {
        const {
            resourceId,
            resourceType,
            key,
            action,
            comment,
            value,
            details,
        } = data

        const newNotificationId = await getNotificationId()
        const editId = mongoose.Types.ObjectId()
        const post = new Post({
            messages: [
                {
                    messageType: 'suggestedEdit',
                    author: ws.account,
                    details: {
                        editId,
                        resourceId,
                        resourceType,
                        communityId: details.communityId,
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
                },
            ],
            users: [ws.account],
        })

        await post.save()

        await Advice.updateOne(
            { _id: details.adviceId },
            {
                $push: {
                    suggestedChanges: {
                        suggested: ws.account,
                        action,
                        key,
                        resourceId: details.adviceId,
                        value,
                        resourceType,
                        details: { stepId: resourceId },
                        _id: editId,
                        post: post._id,
                    },
                    posts: post._id,
                },
                $inc: { suggestedChangesCount: 1 },
            },
            { useFindAndModify: false }
        )
        await Community.updateOne(
            { _id: details.communityId },
            {
                $push: {
                    posts: post._id,
                },
            },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The new Community is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.reviewResult = (data, ws) => {
    if (data.resourceType === 'step') reviewResultStep(data, ws)
    else reviewResultResource(data, ws)
}

const reviewResultResource = async (data, ws) => {
    try {
        const {
            resourceId,
            resourceType,
            change,
            comment,
            decision,
            itemId,
            communityId,
        } = data

        const newNotificationId = await getNotificationId()
        const model = getModelFromType(resourceType)

        if (model) {
            const now = new Date()
            if (decision && communityId) {
                await Community.updateOne(
                    { _id: communityId },
                    { $set: { updated: now } },
                    {
                        useFindAndModify: false,
                    }
                )
            }
            let resourceActions = {
                $pull: {
                    suggestedChanges: {
                        _id: change._id,
                    },
                },
                $inc: {
                    suggestedChangesCount: -1,
                },
            }
            if (change.action === 'change') {
                resourceActions = {
                    ...resourceActions,
                    $push: {
                        appliedChanges: {
                            ...change,
                            approved: decision,
                        },
                    },
                    ...(decision
                        ? {
                              $set: {
                                  [change.key]: change.value,
                                  updated: now,
                              },
                              $inc: {
                                  ...resourceActions.$inc,
                                  version: 1,
                              },
                          }
                        : {}),
                }
                await model.updateOne({ _id: resourceId }, resourceActions, {
                    useFindAndModify: false,
                })
            } else if (change.action === 'delete') {
                if (change.key === 'advice') {
                    resourceActions.$push = {
                        ...resourceActions.$push,
                        appliedChanges: {
                            ...change,
                            approved: decision,
                        },
                    }
                    if (decision) {
                        await Advice.deleteOne({ _id: resourceId })
                        resourceActions = {
                            ...resourceActions,
                            $inc: {
                                ...resourceActions.$inc,
                                version: 1,
                                advicesCount: 1,
                            },
                            $pull: {
                                ...resourceActions.$pull,
                                advices: resourceId,
                            },
                            $set: {
                                ...resourceActions.$set,
                                updated: now,
                            },
                        }
                    }
                    await model.updateOne(
                        { _id: change.details.communityId },
                        resourceActions,
                        { useFindAndModify: false }
                    )
                }
            }
            sendSuccess(ws, 'Applied')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

const reviewResultStep = async (data, ws) => {
    try {
        const {
            resourceId,
            resourceType,
            change,
            comment,
            decision,
            itemId,
            communityId,
        } = data
        const now = new Date()
        if (decision && communityId) {
            await Community.updateOne(
                { _id: communityId },
                { $set: { updated: now } },
                {
                    useFindAndModify: false,
                }
            )
        }
        const newNotificationId = await getNotificationId()

        let resourceActions = {
            $pull: {
                suggestedChanges: {
                    _id: change._id,
                },
            },
            $inc: {
                suggestedChangesCount: -1,
            },
        }
        if (change.action === 'change') {
            resourceActions = {
                ...resourceActions,
                $push: {
                    appliedChanges: {
                        ...change,
                        approved: decision,
                    },
                },
                ...(decision
                    ? {
                          $set: {
                              ...resourceActions.$set,
                              ['steps.$.' + change.key]: change.value,
                              updated: now,
                          },
                          $inc: {
                              ...resourceActions.$inc,
                              version: 1,
                          },
                      }
                    : {}),
            }
            await Advice.updateOne(
                {
                    _id: resourceId,
                    'steps._id': change.details.stepId,
                },
                resourceActions,
                {
                    useFindAndModify: false,
                }
            )
        } else if (change.action === 'changePos') {
            resourceActions.$push = {
                ...resourceActions.$push,
                appliedChanges: {
                    ...change,
                    approved: decision,
                },
            }
            if (decision) {
                const advice = await Advice.findById(resourceId)
                    .select('__v steps')
                    .exec()

                if (advice) {
                    advice.steps = arrayMove(
                        advice.steps,
                        advice.steps.findIndex(
                            item =>
                                item._id.toString() ===
                                change.details.stepId.toString()
                        ),
                        change.value - 1 < advice.steps.length
                            ? change.value - 1
                            : advice.steps.length - 1
                    )
                }
                await advice.save()
                resourceActions = {
                    ...resourceActions,
                    $inc: {
                        ...resourceActions.$inc,
                        version: 1,
                    },
                    $set: {
                        ...resourceActions.$set,
                        updated: now,
                    },
                }
            }
            await Advice.updateOne({ _id: resourceId }, resourceActions, {
                useFindAndModify: false,
            })
        } else if (change.action === 'add') {
            resourceActions.$push = {
                ...resourceActions.$push,
                appliedChanges: {
                    ...change,
                    approved: decision,
                },
            }
            if (decision) {
                const advice = await Advice.findById(resourceId)
                    .select('__v steps')
                    .exec()

                if (advice) {
                    advice.steps.splice(change.details.place, 0, {
                        ...change.value,
                        owner: change.suggested,
                    })
                }
                await advice.save()
                resourceActions = {
                    ...resourceActions,
                    $inc: {
                        ...resourceActions.$inc,
                        version: 1,
                    },
                    $set: {
                        ...resourceActions.$set,
                        updated: now,
                    },
                }
            }
            await Advice.updateOne({ _id: resourceId }, resourceActions, {
                useFindAndModify: false,
            })
        } else if (change.action === 'delete') {
            resourceActions.$push = {
                ...resourceActions.$push,
                appliedChanges: {
                    ...change,
                    approved: decision,
                },
            }
            if (decision)
                resourceActions = {
                    ...resourceActions,
                    $inc: {
                        ...resourceActions.$inc,
                        version: 1,
                    },
                    $pull: {
                        ...resourceActions.$pull,
                        steps: { _id: change.details.stepId },
                    },
                    $set: {
                        ...resourceActions.$set,
                        updated: now,
                    },
                }
            await Advice.updateOne({ _id: resourceId }, resourceActions, {
                useFindAndModify: false,
            })
        }
        sendSuccess(ws, 'Applied')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.createResource = async (data, ws) => {
    try {
        const { value, communityId, type } = data

        const model = getModelFromType(type)
        const attr = getModelFromType.getPrefix(type)
        const now = new Date()
        const resource = new model({
            owner: ws.account,
            collaborators: [ws.account],
            image: value.images.length ? value.images[0] : '',
            community: communityId,
            sadmins: ws.account,
            ...value,
        })
        await resource.save()

        await Community.updateOne(
            { _id: communityId },
            {
                $inc: {
                    version: 1,
                    [attr + 'Count']: 1,
                },
                $push: { [attr]: resource._id },
                $set: { updated: now },
            },
            { useFindAndModify: false }
        )

        // const post = new Post({
        //     messages: [
        //         {
        //             messageType: 'add',
        //             author: ws.account,
        //             details: {
        //                 editId,
        //                 resourceId: communityId,
        //                 resourceType: 'community',
        //                 communityId,
        //             },
        //         },
        //         ...(comment
        //             ? [
        //                   {
        //                       messageType: 'text',
        //                       author: ws.account,
        //                       text: comment,
        //                   },
        //               ]
        //             : []),
        //     ],
        //     users: [ws.account],
        // })

        // await post.save()

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
