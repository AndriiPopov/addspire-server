const auth = require('../middleware/auth')
const authNotForce = require('../middleware/authNotForce')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const { Transaction } = require('../models/transaction')
const express = require('express')
const getAccount = require('../utils/getAccount')
const Joi = require('@hapi/joi')
const { resSendError } = require('../utils/resError')
const { JoiLength } = require('../constants/fieldLength')
const { Post } = require('../models/post')
const router = express.Router()

router.get('/', auth, async (req, res, next) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name image friends wallet perks transactions progresses'
            )
        }
        let friends = account.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image')
            .lean()
            .exec()

        const transactions = await Transaction.find({
            _id: { $in: account.transactions },
        })
            .lean()
            .exec()

        res.send({
            account: {
                ...account,
                friendsData: friends,
                transactionsData: transactions,
            },
            success: true,
        })
    } catch (ex) {}
})

router.get('/:_id/:perkId', authNotForce, async (req, res, next) => {
    try {
        let profile = await Account.findById(req.params._id)
            .select({
                perks: { $elemMatch: { perkId: req.params.perkId } },
                name: 1,
                image: 1,
            })
            .lean()
            .exec()
        if (profile && profile.perks && profile.perks.length > 0) {
            const perk = profile.perks[0]
            if (perk.post.length > 0) {
                const post = await Post.findById(perk.post[0])
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
                        perk,
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
            account,
            success: false,
        })
    } catch (ex) {}
})

const addPerkSchema = Joi.object({
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
    users: Joi.array().items(Joi.string()),
    price: Joi.number().min(0),
})

router.post('/add', auth, async (req, res, next) => {
    try {
        const data = req.body
        const { error } = addPerkSchema.validate({
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
                'name friends perks currentId transactions wallet progresses',
                true
            )
        }
        let perkId = data.id
        if (perkId) {
            account.perks = account.toObject().perks.map(perk => {
                if (perk.perkId === perkId) return { ...perk, ...data.value }
                else return perk
            })
        } else {
            perkId = 'perk_' + account.currentId
            account.currentId = account.currentId + 1
            account.perks = [{ perkId, ...data.value }, ...account.perks]
        }
        account.save()
        let friends = account.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image ')
            .lean()
            .exec()
        const transactions = await Transaction.find({
            _id: { $in: account.transactions },
        })
            .lean()
            .exec()

        res.send({
            account: {
                ...account.toObject(),
                friendsData: friends,
                transactionsData: transactions,
            },
            success: true,
            successCode: 'item added',
        })
    } catch (ex) {
        console.log(ex)
        next(ex)
    }
})

const buyPerkSchema = Joi.object({
    perkId: Joi.string()
        .max(JoiLength.id)
        .required(),
    ownerId: Joi.string()
        .max(JoiLength.id)
        .required(),
})

router.post('/buy', auth, async (req, res) => {
    try {
        const data = req.body
        const { error } = buyPerkSchema.validate(data)
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
                'transactions wallet perks friends name image  progresses',
                true
            )
        }
        const owner =
            data.ownerId !== account._id
                ? await Account.findById(data.ownerId)
                      .select(
                          'transactions wallet perks friends name image progresses'
                      )
                      .exec()
                : account

        const perkId = data.perkId
        if (owner && account && perkId) {
            const accountInFriends = owner.friends.find(
                item => item.friend === account._id
            )

            if (
                (accountInFriends && accountInFriends.status === 'friend') ||
                owner._id === account._id
            ) {
                const perk = owner.perks.find(item => item.perkId === perkId)
                const currency = account.wallet.find(
                    item => item.user === owner._id
                )

                if (perk && currency && perk.price <= currency.amount) {
                    let transaction = new Transaction({
                        from: owner._id,
                        to: account._id,
                        item: {
                            itemName: perk.name,
                            itemDescription: perk.description,
                            itemImages: perk.images,
                            mode: 'item',
                        },
                        amount: perk.price,
                        status: 'Not confirmed',
                    })

                    transaction.markModified('item')

                    transaction = await transaction.save()

                    if (owner.transactions)
                        owner.transactions.unshift(transaction._id.toString())
                    else owner.transactions = [transaction._id.toString()]
                    if (owner._id !== account._id) {
                        if (account.transactions)
                            account.transactions.unshift(
                                transaction._id.toString()
                            )
                        else account.transactions = [transaction._id.toString()]
                    }

                    currency.amount = currency.amount - perk.price
                    await owner.save()
                    if (owner._id !== account._id) await account.save()

                    let friends = owner.friends.map(item => item.friend)
                    friends = await Account.find({
                        _id: { $in: friends },
                    })
                        .select('name image')
                        .lean()
                        .exec()

                    const transactions = await Transaction.find({
                        _id: { $in: owner.transactions },
                    })
                        .lean()
                        .exec()

                    if (account._id !== owner._id)
                        res.send({
                            // account: account.toObject(),
                            // profile: {
                            //     ...owner.toObject(),
                            //     friendsData: friends,
                            //     transactionsData: transactions,
                            // },
                            successCode: 'item bought',
                            success: true,
                        })
                    else
                        res.send({
                            // account: {
                            //     ...account.toObject(),
                            //     friendsData: friends,
                            //     transactionsData: transactions,
                            // },
                            // profile: {
                            //     ...owner.toObject(),
                            //     friendsData: friends,
                            //     transactionsData: transactions,
                            // },
                            success: true,
                            successCode: 'item bought',
                        })
                    return
                }
            }
        }

        res.send({
            success: false,
        })
    } catch (ex) {
        console.log(ex)
    }
})

router.post('/delete/:id', auth, async (req, res) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name friends perks currentId transactions wallet progresses',
                true
            )
        }
        const perkId = req.params.id
        if (perkId) {
            account.perks = account
                .toObject()
                .perks.filter(perk => perk.perkId !== perkId)
        }
        account.save()
        let friends = account.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image')
            .lean()
            .exec()
        const transactions = await Transaction.find({
            _id: { $in: account.transactions },
        })
            .lean()
            .exec()
        res.send({
            account: {
                ...account.toObject(),
                friendsData: friends,
                transactionsData: transactions,
            },
            success: true,
            successCode: 'item deleted',
        })
    } catch (ex) {}
})

const editTrancsactionSchema = Joi.object({
    transactionId: Joi.string()
        .max(JoiLength.id)
        .required(),
})

router.post('/confirm', auth, async (req, res) => {
    try {
        const data = req.body
        const { error } = editTrancsactionSchema.validate(data)
        if (error) {
            console.log(error)
            resSendError(res, 'bad data')
            return
        }
        await Transaction.findOneAndUpdate(
            { _id: data.transactionId },
            { status: 'Confirmed' }
        )
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name friends perks currentId transactions wallet progresses'
            )
        }
        let friends = account.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image')
            .lean()
            .exec()

        const transactions = await Transaction.find({
            _id: { $in: account.transactions },
        })
            .lean()
            .exec()

        res.send({
            account: {
                ...account,
                friendsData: friends,
                transactionsData: transactions,
            },
            success: true,
            successCode: 'transaction confirmed',
        })
    } catch (ex) {
        console.log(ex)
    }
})

router.post('/cancel', auth, async (req, res) => {
    try {
        const data = req.body
        const { error } = editTrancsactionSchema.validate(data)
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
                'name friends wallet perks transactions',
                true
            )
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: data.transactionId },
            { status: 'Cancelled' }
        )
        const buyer =
            account._id === transaction.to
                ? account
                : await Account.findById(transaction.to)
                      .select('wallet')
                      .exec()

        const currency = buyer.wallet.find(
            item => item.user === transaction.from
        )

        currency.amount = currency.amount + transaction.amount

        await buyer.save()

        let friends = account.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image')
            .lean()
            .exec()

        const transactions = await Transaction.find({
            _id: { $in: account.transactions },
        })
            .lean()
            .exec()

        res.send({
            account: {
                ...account.toObject(),
                friendsData: friends,
                transactionsData: transactions,
            },
            success: true,
            successCode: 'transaction cancelled',
        })
    } catch (ex) {
        console.log(ex)
    }
})

module.exports = router
