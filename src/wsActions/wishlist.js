const { User } = require('../models/user')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')
const { Post } = require('../models/post')

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
            .select('wishlist currentId followPosts __v')
            .exec()
        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }
        let wishlistItemId = data.id
        if (wishlistItemId) {
            account.wishlist = account.toObject().wishlist.map(item => {
                if (item.itemId === wishlistItemId)
                    return { ...item, ...data.value }
                else return item
            })
        } else {
            const post = new Post({
                users: [account._id],
            })
            post.save()
            account.followPosts.push(post._id.toString())
            wishlistItemId = 'wishlistItem_' + account.currentId
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
            .select('wishlist followPosts  __v')
            .exec()

        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }
        const itemId = data.id
        let postId
        if (itemId) {
            account.wishlist = account.toObject().wishlist.filter(item => {
                if (item.itemId !== itemId) {
                    return true
                } else {
                    postId = item.post
                    return false
                }
            })
        }
        if (postId)
            account.followPosts.filter(
                item => item.toString() !== postId.toString()
            )
        account.save()

        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}
