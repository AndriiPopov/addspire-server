const { User } = require('../models/user')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')
const { Post } = require('../models/post')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')

const saveWishlistItemSchema = Joi.object({
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

module.exports.saveWishlistItem = async (data, ws) => {
    try {
        const { error } = saveWishlistItemSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.accountId)
            .select('wishlist currentId notifications myPosts __v')
            .exec()
        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }
        let wishlistItemId = data.id
        const newNotificationId = await getNotificationId()

        if (wishlistItemId) {
            let postId
            account.wishlist = account.toObject().wishlist.map(item => {
                if (item.itemId === wishlistItemId) {
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
                            action: 'edit wishlist item',
                            image: data.value.images,
                            messageId: '0',
                            messageType: 'wishlist',
                            details: {
                                owner: account._id,
                                name: data.value.name,
                                itemId: wishlistItemId,
                            },
                        },
                    },
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: account._id,
                                    code: 'edit wishlist item',
                                    notId: newNotificationIdPost,
                                    details: {
                                        itemId: wishlistItemId,
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
                code: 'edit wishlist item',
                notId: newNotificationId,
                details: {
                    itemId: wishlistItemId,
                    itemName: data.value.name,
                },
            })
        } else {
            wishlistItemId = 'wishlistItem_' + account.currentId
            const post = new Post({
                users: [account._id],
                parent: account._id,
                startMessage: {
                    author: account._id,
                    text: data.value.description,
                    action: 'add wishlist item',
                    image: data.value.images,
                    messageId: '0',
                    messageType: 'wishlist',
                    details: {
                        owner: account._id,
                        name: data.value.name,
                        itemId: wishlistItemId,
                    },
                },
            })
            post.save()
            account.myPosts.push(post._id.toString())
            addNotification(account, {
                user: account._id,
                code: 'add wishlist item',
                notId: newNotificationId,
                details: {
                    itemName: data.value.name,
                    itemId: wishlistItemId,
                },
            })
            account.currentId = account.currentId + 1
            account.wishlist = [
                { itemId: wishlistItemId, ...data.value, post: post._id },
                ...account.wishlist,
            ]
        }
        account.save()
        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}

const deleteWishlistItemSchema = Joi.object({
    accountId: Joi.string().required(),
    id: Joi.string().required(),
}).unknown(true)

module.exports.deleteWishlistItem = async (data, ws) => {
    try {
        const { error } = deleteWishlistItemSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.accountId)
            .select('wishlist notifications myPosts  __v')
            .exec()

        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }
        const itemId = data.id
        let postId
        let itemName = ''
        if (itemId) {
            account.wishlist = account.toObject().wishlist.filter(item => {
                if (item.itemId !== itemId) {
                    return true
                } else {
                    itemName = item.name
                    postId = item.post
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
            code: 'delete wishlist item',
            notId: newNotificationId,
            details: {
                itemName,
            },
        })
        account.save()

        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}
