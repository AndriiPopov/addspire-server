const { User } = require('../models/user')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')

const searchFriendsSchema = Joi.object({
    search: Joi.string().max(JoiLength.name),
}).unknown(true)

module.exports.searchFriends = async (data, ws) => {
    try {
        const { error } = searchFriendsSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const id = data.search.toLowerCase()
        const friend = await Account.findById(id)
            .select('image name')
            .lean()
        if (friend) {
            ws.send(
                JSON.stringify({
                    messageCode: 'friendSearchResult',
                    data: friend,
                })
            )
        } else {
            console.log('sending error')
            sendError(ws, 'No accounts with nickname ' + data.search + ' .')
        }
    } catch (ex) {
        sendError(ws, 'Bad data!')
    }
}

const changeFriendshipSchema = Joi.object({
    accountId: Joi.string().required(),
    friendId: Joi.string().required(),
}).unknown(true)

module.exports.addFriend = async (data, ws) => {
    try {
        const { error } = changeFriendshipSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.accountId)
            .select('friends __v')
            .exec()

        if (!account) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const friendId = data.friendId
        if (account._id.toString() === friendId) {
            sendError(ws, 'Bad data!')
            return
        }

        const friend = await Account.findById(friendId)
            .select('friends __v')
            .exec()

        if (friend) {
            if (
                !account.friends.some(
                    item => item.friend.toString() === friend._id.toString()
                )
            ) {
                account.friends.unshift({
                    friend: friend._id,
                    status: 'invited',
                })
            }
            if (
                !friend.friends.some(
                    item => item.friend.toString() === account._id.toString()
                )
            ) {
                friend.friends.unshift({
                    friend: account._id,
                    status: 'inviting',
                })
            }
            friend.save()
            account.save()

            sendSuccess(ws)
        } else {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.acceptFriend = async (data, ws) => {
    try {
        const { error } = changeFriendshipSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.accountId)
            .select('friends __v')
            .exec()

        if (!account) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const friendId = data.friendId
        if (account._id.toString() === friendId) {
            sendError(ws, 'Bad data!')
            return
        }

        const friend = await Account.findById(friendId)
            .select('friends __v')
            .exec()

        if (friend) {
            account.friends = account.friends.map(item => {
                if (item.friend.toString() === friendId.toString())
                    return { ...item.toObject(), status: 'friend' }
                else return item.toObject()
            })
            friend.friends = friend.friends.map(item => {
                if (item.friend.toString() === account._id.toString())
                    return { ...item.toObject(), status: 'friend' }
                else return item.toObject()
            })
            friend.save()
            account.save()

            sendSuccess(ws)
        } else {
            account.friends = account.friends.filter(
                item => item.friend.toString() !== friendId
            )
            account.save()
            sendError(ws, 'You cannot accept this friendship request.')
            return
        }
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}

module.exports.unfriend = async (data, ws) => {
    try {
        const { error } = changeFriendshipSchema.validate(data)
        if (error) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const account = await Account.findById(data.accountId)
            .select('friends wallet __v')
            .exec()

        if (!account) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        const friendId = data.friendId
        if (account._id.toString() === friendId) {
            sendError(ws, 'Bad data!')
            return
        }

        account.friends = account.friends.filter(
            item => item.friend !== friendId
        )
        account.wallet = account.wallet.filter(item => item.user !== friendId)
        account.save()

        const friend = await Account.findById(friendId)
            .select('friends wallet __v')
            .exec()

        if (friend) {
            friend.friends = friend.friends.filter(
                item => item.friend !== account._id
            )
            friend.wallet = friend.wallet.filter(
                item => item.user !== account._id
            )
            friend.save()
        }
        sendSuccess(ws)
    } catch (ex) {
        sendError(ws, 'Something failed.')
    }
}
