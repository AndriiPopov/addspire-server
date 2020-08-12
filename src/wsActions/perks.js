const { User } = require('../models/user')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')
const { Post } = require('../models/post')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')

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
            .select('perks currentId notifications myPosts __v')
            .exec()
        if (!account) {
            sendError(ws, 'Bad data!')
            return
        }

        let perkId = data.id
        const newNotificationId = await getNotificationId()
        if (perkId) {
            let postId
            account.perks = account.toObject().perks.map(perk => {
                if (perk.perkId === perkId) {
                    postId = item.post
                    return { ...perk, ...data.value }
                } else return perk
            })
            const newNotificationIdPost = await getNotificationId()

            await Post.findOneAndUpdate(
                { _id: postId },
                {
                    $set: {
                        startMessage: {
                            author: account._id,
                            text: data.value.description,
                            action: 'edit perk',
                            image: data.value.images,
                            messageId: '0',
                            messageType: 'perk',
                            details: {
                                owner: account._id,
                                name: data.value.name,
                                itemId: perkId,
                            },
                        },
                    },
                    $push: {
                        notifications: {
                            $each: [
                                {
                                    user: account._id,
                                    code: 'edit perk',
                                    notId: newNotificationIdPost,
                                    details: {
                                        itemId: perkId,
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
                code: 'edit perk',
                notId: newNotificationId,
                details: {
                    itemId: perkId,
                    itemName: data.value.name,
                },
            })
        } else {
            perkId = 'perk_' + account.currentId
            const post = new Post({
                users: [account._id],
                parent: account._id,
                startMessage: {
                    author: account._id,
                    text: data.value.description,
                    action: 'add perk',
                    image: data.value.images,
                    messageId: '0',
                    messageType: 'perk',
                    details: {
                        owner: account._id,
                        name: data.value.name,
                        itemId: perkId,
                    },
                },
            })
            post.save()
            account.myPosts.push(post._id.toString())
            addNotification(account, {
                user: account._id,
                code: 'add perk',
                notId: newNotificationId,
                details: {
                    itemName: data.value.name,
                    itemId: perkId,
                },
            })
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
            .select('perks notifications myPosts __v')
            .exec()
        if (!account) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        let postId
        const perkId = data.id
        let itemName = ''
        if (perkId) {
            account.perks = account.toObject().perks.filter(item => {
                if (item.perkId !== perkId) {
                    return true
                } else {
                    itemName = item.name
                    postId = item.post
                    return false
                }
            })
        }
        if (postId)
            account.followPosts.filter(
                item => item.toString() !== postId.toString()
            )
        const newNotificationId = await getNotificationId()
        addNotification(account, {
            user: account._id,
            code: 'delete perk',
            notId: newNotificationId,
            details: {
                itemName,
            },
        })
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
            .select(
                'transactions notifications myNotifications wallet perks friends __v'
            )
            .exec()

        const owner =
            data.seller !== account._id
                ? await Account.findById(data.seller)
                      .select(
                          'transactions notifications myNotifications wallet perks friends __v'
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

                if (
                    perk &&
                    (perk.users.length === 0 ||
                        perk.users.includes(account._id.toString())) &&
                    currency &&
                    perk.price <= currency.amount
                ) {
                    let transaction = new Transaction({
                        from: owner._id,
                        to: account._id,
                        item: {
                            itemName: perk.name,
                            itemId: perk.perkId,
                            itemDescription: perk.description,
                            itemImages: perk.images,
                            mode: 'item',
                        },
                        amount: perk.price,
                        status: 'Not confirmed',
                    })

                    transaction.markModified('item')

                    transaction = await transaction.save()

                    owner.transactions.unshift(transaction._id.toString())

                    if (owner._id !== account._id) {
                        account.transactions.unshift(transaction._id.toString())
                    }

                    currency.amount = currency.amount - perk.price

                    const newNotificationId = await getNotificationId()
                    const notification = {
                        user: account._id,
                        code: 'buy perk',
                        notId: newNotificationId,
                        details: {
                            itemName: perk.name,
                            itemId: perk.perkId,
                            price: perk.price,
                            owner: owner._id,
                        },
                    }
                    addNotification(owner, notification, true, true)
                    await owner.save()
                    if (owner._id !== account._id) {
                        addNotification(account, notification, true, true)
                        await account.save()
                    }

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
