const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendSuccess, sendError } = require('./confirm')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { followAccount } = require('./account')

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
        const friend = await Account.find({
            $or: [
                { _id: new RegExp(id, 'gi') },
                { name: new RegExp(id, 'gi') },
            ],
        })
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

module.exports.shareWithFriends = async (data, ws) => {
    try {
        // const { error } = changeFriendshipSchema.validate(data)
        // if (error) {
        //     console.log(error)
        //     sendError(ws, 'Bad data!')
        //     return
        // }

        if (!data.accountId || !data.url || !data.friends) {
            console.log(error)
            sendError(ws, 'Bad data!')
            return
        }

        for (let id of data.friends) {
            const account = await Account.findById(id)
                .select('myNotifications __v')
                .exec()
            if (account) {
                const newNotificationId = await getNotificationId()
                if (data.item)
                    addNotification(
                        account,
                        {
                            user: data.accountId,
                            code: 'shared',
                            notId: newNotificationId,
                            details: { ...data.item, url: data.url },
                        },
                        true
                    )

                account.save()
            }
        }
        sendSuccess(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Something failed.')
    }
}
