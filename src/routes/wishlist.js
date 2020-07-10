const auth = require('../middleware/auth')
const authNotForce = require('../middleware/authNotForce')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const { Transaction } = require('../models/transaction')
const express = require('express')
const getAccount = require('../utils/getAccount')

const router = express.Router()

router.get('/', auth, async (req, res, next) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(req, res, 'name wishlist')
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
            })
            .lean()
            .exec()
        let account
        if (req.user) {
            account = await getAccount(req, res, 'name image', false, true)
        }

        if (profile && profile.wishlist && profile.wishlist.length > 0) {
            res.send({
                account,
                wishlistItem: profile.wishlist[0],
                success: true,
            })
        } else {
            res.send({
                account,
                success: false,
            })
        }
    } catch (ex) {}
})

router.post('/add', auth, async (req, res) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name wishlist currentId',
                true
            )
        }
        let wishlistItemId = req.body.id
        if (wishlistItemId) {
            account.wishlist = account.toObject().wishlist.map(item => {
                if (item.itemId === wishlistItemId)
                    return { ...item, ...req.body.value }
                else return item
            })
        } else {
            wishlistItemId = 'wishlistItem_' + account.currentId
            account.currentId = account.currentId + 1
            account.wishlist = [
                { wishlistItemId, ...req.body.value },
                ...account.wishlist,
            ]
        }
        account.save()

        res.send({
            account: account.toObject(),
            success: true,
        })
    } catch (ex) {}
})

router.post('/delete/:id', auth, async (req, res) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(req, res, 'name wishlist', true)
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
        })
    } catch (ex) {}
})

module.exports = router
