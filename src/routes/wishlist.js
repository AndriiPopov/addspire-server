const auth = require('../middleware/auth')
const authNotForce = require('../middleware/authNotForce')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const { Transaction } = require('../models/transaction')
const express = require('express')
const getAccount = require('../utils/getAccount')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')
const { resSendError } = require('../utils/resError')
const { Post } = require('../models/post')
const wishlistItemSchema = require('../models/schemas/wishlistItem')
const router = express.Router()

router.get('/', auth, async (req, res, next) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(req, res, 'name wishlist image')
        }

        res.send({
            account,
            success: true,
        })
    } catch (ex) {}
})

router.get('/:_id/:wishlistItemId', authNotForce, async (req, res, next) => {
    try {
        let profile = await Account.findById(req.params._id)
            .select({
                wishlist: { $elemMatch: { itemId: req.params.wishlistItemId } },
                name: 1,
                image: 1,
            })
            .lean()
            .exec()

        if (profile && profile.wishlist && profile.wishlist.length > 0) {
            const wishlistItem = profile.wishlist[0]
            if (wishlistItem.post.length > 0) {
                const post = await Post.findById(wishlistItem.post[0])
                    .lean()
                    .exec()
                if (post) {
                    const friendData = await Account.find({
                        _id: { $in: post.users },
                    })
                        .select('name image notifications')
                        .lean()
                        .exec()

                    res.send({
                        wishlistItem,
                        profile,
                        post,
                        friendData,
                        success: true,
                    })
                    return
                }
            }
        }
        res.send({
            success: false,
        })
    } catch (ex) {}
})

const addWishlistSchema = Joi.object({
    id: Joi.string()
        .max(JoiLength.id)
        .allow(''),
    name: Joi.string()
        .min(1)
        .max(JoiLength.name)
        .required(),
    description: Joi.string()
        .min(0)
        .max(JoiLength.description)
        .allow(''),
    images: Joi.array().items(Joi.string()),
})

router.post('/add', auth, async (req, res) => {
    try {
        const data = req.body
        const { error } = addWishlistSchema.validate({
            ...data.value,
            id: data.id,
        })
        if (error) {
            console.log(error)
            resSendError(res, 'bad data')
            return
        }
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name wishlist currentId',
                true
            )
        }
        let wishlistItemId = data.id
        if (wishlistItemId) {
            account.wishlist = account.toObject().wishlist.map(item => {
                if (item.itemId === wishlistItemId)
                    return { ...item, ...data.value }
                else return item
            })
        } else {
            wishlistItemId = 'wishlistItem_' + account.currentId
            account.currentId = account.currentId + 1
            account.wishlist = [
                { itemId: wishlistItemId, ...data.value },
                ...account.wishlist,
            ]
        }
        account.save()

        res.send({
            account: account.toObject(),
            success: true,
            successCode: 'item saved',
        })
    } catch (ex) {}
})

router.post('/delete/:id', auth, async (req, res) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(req, res, 'name wishlist image', true)
        }
        const itemId = req.params.id
        if (itemId) {
            account.wishlist = account
                .toObject()
                .wishlist.filter(item => item.itemId !== itemId)
        }
        account.save()

        res.send({
            account: account.toObject(),
            success: true,
            successCode: 'item deleted',
        })
    } catch (ex) {}
})

module.exports = router
