const { Reward } = require('../models/reward')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendError, sendSuccess } = require('./confirm')
const { Post } = require('../models/post')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')

module.exports.saveReward = async (data, ws) => {
    try {
        if (data.accountId) {
            const account = await Account.findById(data.accountId).select(
                '__v rewards wishlist notifications myPosts'
            )
            if (account) {
                const newData = {
                    name: data.reward.name,
                    images: data.reward.images,
                    description: data.reward.description,
                    descriptionText: data.reward.descriptionText,
                }
                const newNotificationId = await getNotificationId()

                if (data.reward._id) {
                    await Reward.updateOne({ _id: data.reward._id }, newData, {
                        useFindAndModify: false,
                    })

                    let reward = await Reward.findById(data.reward._id)
                        .select('post wish')
                        .lean()
                        .exec()
                    if (reward) {
                        // const newNotificationIdPost = await getNotificationId()

                        // await Post.findOneAndUpdate(
                        //     { _id: reward.post },
                        //     {
                        //         $set: {
                        //             startMessage: {
                        //                 author: account._id,
                        //                 text: newData.description,
                        //                 action: reward.wish
                        //                     ? 'edit wishlist item'
                        //                     : 'edit reward',
                        //                 image: newData.images,
                        //                 messageId: '0',
                        //                 messageType: reward.wish
                        //                     ? 'wishlist'
                        //                     : 'reward',
                        //                 details: {
                        //                     owner: account._id,
                        //                     name: newData.name,
                        //                     itemId: reward._id,
                        //                 },
                        //             },
                        //         },
                        //         $push: {
                        //             notifications: {
                        //                 $each: [
                        //                     {
                        //                         user: account._id,
                        //                         code: reward.wish
                        //                             ? 'edit wishlist item'
                        //                             : 'edit reward',
                        //                         notId: newNotificationIdPost,
                        //                         details: {
                        //                             itemId: reward._id,
                        //                         },
                        //                     },
                        //                 ],
                        //                 $position: 0,
                        //                 $slice: 20,
                        //             },
                        //         },
                        //     },
                        //     { useFindAndModify: false }
                        // )
                        addNotification(account, {
                            user: account._id,
                            code: reward.wish
                                ? 'edit wishlist item'
                                : 'edit reward',
                            notId: newNotificationId,
                            details: {
                                itemId: reward._id,
                                itemName: newData.name,
                            },
                        })
                    }
                } else {
                    const reward = new Reward({
                        ...newData,
                        wish: data.wish || false,
                        owner: account._id,
                    })
                    // const post = new Post({
                    //     users: [data.accountId],
                    //     parent: {
                    //         parentId: reward._id,
                    //         parentType: reward.wish ? 'wishlist' : 'reward',
                    //     },
                    //     startMessage: {
                    //         author: data.accountId,
                    //         text: newData.description,
                    //         action: reward.wish
                    //             ? 'add wishlist item'
                    //             : 'add reward',
                    //         image: newData.images,
                    //         messageId: '0',
                    //         messageType: reward.wish ? 'wishlist' : 'reward',
                    //         details: {
                    //             owner: data.accountId,
                    //             name: newData.name,
                    //             itemId: reward._id,
                    //         },
                    //     },
                    // })
                    // await post.save()
                    // reward.post = post._id
                    await reward.save()

                    account.myPosts.push(post._id.toString())

                    addNotification(account, {
                        user: account._id,
                        code: reward.wish ? 'add wishlist item' : 'add reward',
                        notId: newNotificationId,
                        details: {
                            itemName: newData.name,
                            itemId: reward._id,
                        },
                    })
                    account.rewards.push(reward._id)
                    account.myPosts.push(post._id.toString())
                }
                await account.save()
                sendSuccess(ws)
                return
            }
        }
        sendError(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.changeLikesReward = async (data, ws) => {
    try {
        if (data.rewardId && data.accountId) {
            if (data.add) {
                await Reward.updateOne(
                    { _id: data.rewardId },
                    { $addToSet: { likes: data.accountId } },
                    { useFindAndModify: false }
                )
            } else {
                await Reward.updateOne(
                    { _id: data.rewardId },
                    { $pull: { likes: data.accountId } },
                    { useFindAndModify: false }
                )
            }
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.deleteReward = async (data, ws) => {
    try {
        if (data.rewardId && data.accountId) {
            await Reward.deleteOne({ _id: data.rewardId })
            await Account.updateOne(
                { _id: data.accountId },
                { $pull: { rewards: data.rewardId } },
                { useFindAndModify: false }
            )
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}
