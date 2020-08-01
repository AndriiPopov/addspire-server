const { User } = require('../models/user')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')
const { Post } = require('../models/post')

const savePerkSchema = Joi.object({
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
        users: Joi.array().items(Joi.string()),
        price: Joi.number().min(0),
    }),
    accountId: Joi.string().required(),
}).unknown(true)

module.exports.savePerk = async (data, ws) => {
    try {
        const { error } = savePerkSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.accountId)
            .select('perks currentId followPosts __v')
            .exec()
        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }

        let perkId = data.id
        if (perkId) {
            account.perks = account.toObject().perks.map(perk => {
                if (perk.perkId === perkId) return { ...perk, ...data.value }
                else return perk
            })
        } else {
            let post = new Post({
                users: [account._id],
            })
            post = await post.save()
            account.followPosts.push(post._id.toString())
            perkId = 'perk_' + account.currentId
            account.currentId = account.currentId + 1
            account.perks = [
                { perkId, ...data.value, post: post._id },
                ...account.perks,
            ]
        }
        account.save()
        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

const deletePerkSchema = Joi.object({
    accountId: Joi.string().required(),
    id: Joi.string().required(),
}).unknown(true)

module.exports.deletePerk = async (data, ws) => {
    try {
        const { error } = deletePerkSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.accountId)
            .select('perks followPosts __v')
            .exec()
        if (!account) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        let postId
        const perkId = data.id
        if (perkId) {
            account.perks = account.toObject().perks.filter(item => {
                if (item.perkId !== perkId) {
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

const buyPerkSchema = Joi.object({
    perkId: Joi.string().required(),
    buyer: Joi.string().required(),
    seller: Joi.string().required(),
}).unknown(true)

module.exports.buyPerk = async (data, ws) => {
    try {
        const { error } = buyPerkSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.buyer)
            .select('transactions wallet perks friends __v')
            .exec()

        const owner =
            data.seller !== account._id
                ? await Account.findById(data.seller)
                      .select('transactions wallet perks friends __v')
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

                    sendSuccess(ws)
                    return
                }
            }
        }

        sendError(ws, 'Something failed.')
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}
