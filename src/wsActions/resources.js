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
const { Board } = require('../models/board')

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
            value,
            details,
            isAdmin,
        } = data
        const newNotificationId = await getNotificationId()

        const model = getModelFromType(resourceType)

        if (model) {
            const editId = mongoose.Types.ObjectId()
            const post = !isAdmin
                ? new Post({
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
                      ],
                      users: [ws.account],
                  })
                : null

            if (post) await post.save()
            const change = {
                suggested: ws.account,
                action,
                key,
                resourceId,
                value,
                resourceType,
                details,
                _id: editId,
                post: post?._id,
            }
            await model.updateOne(
                { _id: resourceId },
                {
                    $push: {
                        suggestedChanges: change,
                        ...(!isAdmin ? { posts: post._id } : {}),
                    },
                    $inc: { suggestedChangesCount: 1 },
                },
                { useFindAndModify: false }
            )
            if (resourceType !== 'community' && !isAdmin)
                await Community.updateOne(
                    { _id: details.communityId },
                    {
                        $push: {
                            posts: post._id,
                        },
                    },
                    { useFindAndModify: false }
                )
            if (isAdmin)
                reviewResult(
                    {
                        resourceId,
                        resourceType,
                        change,
                        comment: '',
                        decision: true,
                        communityId: details.communityId,
                    },
                    ws
                )
            else sendSuccess(ws, 'The new Community is created')
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
            isAdmin,
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
        if (isAdmin)
            reviewResult(
                {
                    resourceId,
                    resourceType,
                    change,
                    comment: '',
                    decision: true,
                    communityId: details.communityId,
                },
                ws
            )
        else sendSuccess(ws, 'The new Community is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

const reviewResult = (data, ws) => {
    if (data.resourceType === 'step') reviewResultStep(data, ws)
    else reviewResultResource(data, ws)
}

module.exports.reviewResult = reviewResult

const reviewResultResource = async (data, ws) => {
    try {
        const {
            resourceId,
            resourceType,
            change,
            comment,
            decision,
            communityId,
        } = data

        const newNotificationId = await getNotificationId()
        const model = getModelFromType(resourceType)
        const prefix = getModelFromType.getPrefix(resourceType)
        if (model) {
            const now = new Date()
            if (decision && communityId) {
                await Community.updateOne(
                    { _id: communityId },
                    { $set: { updated: now } },
                    { useFindAndModify: false }
                )
            }

            if (change.action === 'change') {
                await model.updateOne(
                    { _id: resourceId },
                    {
                        $pull: {
                            suggestedChanges: { _id: change._id },
                        },
                        $inc: { suggestedChangesCount: -1 },
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
                              }
                            : {}),
                    },
                    { useFindAndModify: false }
                )
            } else if (change.action === 'delete') {
                if (decision) {
                    await Community.updateOne(
                        {
                            _id: change.details.communityId,
                            [prefix]: resourceId,
                        },
                        {
                            $inc: {
                                [prefix + 'Count']: -1,
                            },
                            $pull: { [prefix]: resourceId },
                            $set: { updated: now },
                        },
                        { useFindAndModify: false }
                    )
                    const resource = await model
                        .findOneAndDelete({ _id: resourceId })
                        .select(
                            'saved admins sadmins collaborators owner items'
                        )
                        .exec()

                    if (resource) {
                        await Board.updateMany(
                            {
                                _id: {
                                    $in: resource.saved,
                                },
                                items: {
                                    $elemMatch: {
                                        item: resourceId,
                                        itemType: resourceType,
                                    },
                                },
                            },
                            {
                                $pull: {
                                    items: {
                                        item: resourceId,
                                        itemType: resourceType,
                                    },
                                },
                                $inc: {
                                    itemsCount: -1,
                                },
                            },
                            { useFindAndModify: false }
                        )
                        await Account.updateMany(
                            {
                                _id: {
                                    $in: [
                                        ...resource.admins,
                                        ...resource.sadmins,
                                        ...resource.collaborators,
                                        resource.owner,
                                    ],
                                },
                            },
                            {
                                $pull: {
                                    admin: { item: resourceId },
                                    sadmin: { item: resourceId },
                                    collaborator: {
                                        item: resourceId,
                                    },
                                    owner: { item: resourceId },
                                },
                            },
                            { useFindAndModify: false }
                        )
                        if (resourceType === 'board') {
                            for (let item of resource.items) {
                                let modelItem = getModelFromType(item.itemType)
                                await modelItem.updateOne(
                                    {
                                        _id: item.item,
                                        saved: resourceId,
                                    },
                                    {
                                        $pull: {
                                            saved: resourceId,
                                        },
                                        $inc: {
                                            savedCount: -1,
                                        },
                                    },
                                    {
                                        useFindAndModify: false,
                                    }
                                )
                            }
                        }
                    }
                    ws.send(
                        JSON.stringify({
                            messageCode: 'goTo',
                            messageText:
                                '/community/' + change.details.communityId,
                        })
                    )
                }
            } else if (change.action === 'deleteFromBoard') {
                await Board.updateOne(
                    {
                        _id: resourceId,
                        'suggestedChanges._id': change._id,
                    },
                    {
                        $pull: {
                            suggestedChanges: {
                                _id: change._id,
                            },
                        },
                        $inc: {
                            suggestedChangesCount: -1,
                        },
                        $push: {
                            appliedChanges: {
                                ...change,
                                approved: decision,
                            },
                        },
                    },
                    { useFindAndModify: false }
                )

                if (decision) {
                    await Board.updateOne(
                        {
                            _id: resourceId,
                            items: {
                                $elemMatch: {
                                    item: change.details.resourceId,
                                    itemType: change.details.type,
                                },
                            },
                        },
                        {
                            $pull: {
                                items: {
                                    item: change.details.resourceId,
                                    itemType: change.details.type,
                                },
                            },
                            $inc: {
                                itemsCount: -1,
                            },

                            $set: { updated: now },
                        },
                        { useFindAndModify: false }
                    )
                    const modelInn = getModelFromType(change.details.type)
                    if (modelInn)
                        await modelInn.updateOne(
                            {
                                _id: change.details.resourceId,
                                saved: resourceId,
                            },
                            {
                                $pull: {
                                    saved: resourceId,
                                },
                                $inc: {
                                    savedCount: -1,
                                },
                            },
                            { useFindAndModify: false }
                        )
                }
            } else if (change.action === 'addToBoard') {
                await Board.updateOne(
                    {
                        _id: resourceId,
                        'suggestedChanges._id': change._id,
                    },
                    {
                        $pull: {
                            suggestedChanges: {
                                _id: change._id,
                            },
                        },
                        $inc: {
                            suggestedChangesCount: -1,
                        },
                        $push: {
                            appliedChanges: {
                                ...change,
                                approved: decision,
                            },
                        },
                    },
                    { useFindAndModify: false }
                )

                if (decision) {
                    await Board.updateOne(
                        {
                            _id: resourceId,
                            items: {
                                $not: {
                                    $elemMatch: {
                                        item: change.details.resourceId,
                                        itemType: change.details.type,
                                    },
                                },
                            },
                        },
                        {
                            $push: {
                                items: {
                                    item: change.details.resourceId,
                                    itemType: change.details.type,
                                },
                            },
                            $inc: {
                                itemsCount: 1,
                            },

                            $set: { updated: now },
                        },
                        { useFindAndModify: false }
                    )
                    const modelInn = getModelFromType(change.details.type)
                    if (modelInn)
                        await modelInn.updateOne(
                            {
                                _id: change.details.resourceId,
                                saved: { $ne: resourceId },
                            },
                            {
                                $push: {
                                    saved: resourceId,
                                },
                                $inc: {
                                    savedCount: 1,
                                },
                            },
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

        const newNotificationId = await getNotificationId()
        await Account.findOneAndUpdate(
            { _id: ws.account },
            {
                $push: {
                    sadmin: { item: resource._id, itemType: type },
                    owner: { item: resource._id, itemType: type },
                    // notifications: {
                    //     $each: [
                    //         {
                    //             user: ws.account,
                    //             code: 'create new advice',
                    //             details: {
                    //                 adviceId: advice._id,
                    //             },
                    //             notId: newNotificationId,
                    //         },
                    //     ],
                    //     $slice: -20,
                    // },
                },
            },
            { useFindAndModify: false }
        )

        sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.confirmResource = async (data, ws) => {
    try {
        const { resourceId, type, value } = data

        const model = getModelFromType(type)

        const now = new Date()

        await model.updateOne(
            { _id: resourceId },
            {
                $push: { confirmed: { date: now, user: ws.account, value } },
            },
            { useFindAndModify: false }
        )

        sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
