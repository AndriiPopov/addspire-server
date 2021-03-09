const mongoose = require('mongoose')

const { Expo } = require('expo-server-sdk')
const { System } = require('../models/system')
const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
let expo = new Expo()

let notifications = []
module.exports = (el, notification, myNot, bothNot) => {
    if (!myNot || bothNot) {
        el.notifications.unshift(notification)
        if (el.notifications.length > 20) el.notifications.pop()
    }
    if (myNot || bothNot) {
        el.myNotifications.unshift(notification)
        if (el.myNotifications.length > 40) el.myNotifications.pop()
    }
    notifications.push(notification)
}

const init = async () => {
    await System.findOneAndUpdate(
        { name: 'system' },
        { $push: { notifications: { $each: notifications } } }
    )
    notifications = []
}

// setInterval(() => {
//     const minutes = moment().minute()
//     if (
//         (minutes >= 11 && minutes < 19) ||
//         (minutes >= 31 && minutes < 39) ||
//         (minutes >= 51 && minutes < 59)
//     )
//         init()
// }, 300000)

setTimeout(() => setInterval(init, 60000), 30000)

const getMessageDetails = async (not, type) => {
    let account = await Account.findById(not.user)
        .select('followers name')
        .lean()
        .exec()
    if (account) {
        const message = {
            to: [],
            sound: 'default',
            // body: `${account.name} has changed name.`,
            // data: { withSome: 'data' },
            id: not.notId,
        }
        if (type === 'account' || type === 'accountinspiration') {
            let friends = await Account.find({
                _id: { $in: account.followers },
            })
                .select('tokens')
                .lean()
                .exec()
            for (let friend of friends) {
                message.to = [...message.to, ...friend.tokens]
            }
        }
        if (type === 'owner') {
            let friend = await Account.findById(not.details.owner)
                .select('tokens')
                .lean()
                .exec()
            if (friend) message.to = friend.tokens
        }
        if (type === 'inspiration') {
            const inspiration = await Progress.findById(not.details.progressId)
                .select('followers')
                .lean()
                .exec()
            // progress.goal.name
            let friends = await Account.find({
                _id: { $in: inspiration.followers },
            })
                .select('tokens')
                .lean()
                .exec()
            for (let friend of friends) {
                message.to = [...message.to, ...friend.tokens]
            }
        }
        if (message.to.length > 0) return { message, account }
    }
}
const initSend = async () => {
    let system = await System.findOne({ name: 'system' })
    if (!system) {
        return
    } else {
        const notifications = [...system.notifications]
        system.notifications = []
        system.markModified('notifications')
        await system.save()
        const rawMessages = []
        let details
        for (let not of notifications) {
            switch (not.code) {
                case 'change name':
                    details = await getMessageDetails(not, 'account')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} has changed name.`,
                        })
                    }
                    break
                case 'delete account':
                    details = await getMessageDetails(not, 'account')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${
                                details.account.name
                            } has deleted account.`,
                        })
                    }
                    break
                case 'friend request':
                    details = await getMessageDetails(not, 'owner')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${
                                details.account.name
                            } wants to become friends with you.`,
                        })
                    }
                    break
                case 'friend add':
                    details = await getMessageDetails(not, 'account')
                    let friend = await Account.findById(details.friend)
                        .select('name')
                        .lean()
                        .exec()
                    if (details && friend) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} and ${
                                friend.name
                            } became friends.`,
                        })
                    }
                    break
                case 'unfriend':
                    details = await getMessageDetails(not, 'account')
                    friend = await Account.findById(details.friend)
                        .select('name')
                        .lean()
                        .exec()
                    if (details && friend) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} and ${
                                friend.name
                            } stopped being friends.`,
                        })
                    }
                    break
                case 'add wishlist item':
                case 'edit wishlist item':
                case 'delete wishlist item':
                    details = await getMessageDetails(not, 'account')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} ${
                                item.code === 'add wishlist item'
                                    ? 'added to wishlist a new item'
                                    : item.code === 'edit wishlist item'
                                    ? 'edited in wishlist'
                                    : 'deleted from wishlist'
                            } ${not.details.itemName}.`,
                        })
                    }
                    break
                case 'start progress':
                    details = await getMessageDetails(not, 'account')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${
                                details.account.name
                            } started participating in inspiration ${
                                not.details.itemName
                            } as ${details.as}.`,
                        })
                    }
                    break
                case 'stage approve':
                case 'stage progress':
                case 'stage fail':
                case 'stage dismiss':
                    details = await getMessageDetails(not, 'inspiration')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} ${
                                code === 'stage approve'
                                    ? ' approved  '
                                    : code === 'stage progress'
                                    ? ' put into process '
                                    : code === 'stage fail'
                                    ? ' marked as failed '
                                    : ' dismissed '
                            } ${not.details.progressName}.`,
                        })
                    }
                    break
                case 'get reward':
                    details = await getMessageDetails(not, 'accountinspiration')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} recieved ${
                                not.details.reward.itemName
                            } as a reward in inspiration ${
                                not.details.progressName
                            }.`,
                        })
                    }
                    break
                case 'leave progress':
                    details = await getMessageDetails(not, 'accountinspiration')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} left inspiration ${
                                not.details.progressName
                            }.`,
                        })
                    }
                    break
                case 'edit progress':
                    details = await getMessageDetails(not, 'accountinspiration')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} edited inspiration ${
                                not.details.progressName
                            }.`,
                        })
                    }
                    break
                case 'remove from progress':
                    details = await getMessageDetails(not, 'accountinspiration')
                    friend = await Account.findById(details.account)
                        .select('name')
                        .lean()
                        .exec()
                    if (details && friend) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} removed ${
                                friend.name
                            } from inspiration ${not.details.progressName}.`,
                        })
                    }
                    break
                case 'add to progress':
                    details = await getMessageDetails(not, 'accountinspiration')
                    friend = await Account.findById(details.account)
                        .select('name')
                        .lean()
                        .exec()
                    if (details && friend) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} added ${
                                friend.name
                            } to inspiration ${not.details.progressName}.`,
                        })
                    }
                    break
                case 'add reward':
                    details = await getMessageDetails(not, 'accountinspiration')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} added ${
                                not.details.itemName
                            } as a reward in inspiration ${
                                not.details.progressName
                            }.`,
                        })
                    }
                    break
                case 'delete reward':
                    details = await getMessageDetails(not, 'accountinspiration')
                    if (details) {
                        rawMessages.push({
                            ...details.message,
                            body: `${details.account.name} removed ${
                                not.details.itemName
                            } as a reward in inspiration ${
                                not.details.progressName
                            }.`,
                        })
                    }
                    break
                default:
                    break
            }
        }
        let messages = []
        for (let message of rawMessages) {
            const existingMessage = messages.find(
                item => item.id === message.id
            )
            if (existingMessage)
                existingMessage.to = [...existingMessage.to, ...message.to]
            else messages.push(message)
        }
        for (let message of messages) delete message.id

        let chunks = expo.chunkPushNotifications(messages)
        let tickets = []
        ;(async () => {
            for (let chunk of chunks) {
                try {
                    let ticketChunk = await expo.sendPushNotificationsAsync(
                        chunk
                    )
                    console.log('error in push')
                    console.log(chunk)
                    console.log(ticketChunk)
                    tickets.push(...ticketChunk)
                } catch (error) {
                    console.error(error)
                }
            }
        })()

        const timeout = ms => {
            return new Promise(resolve => setTimeout(resolve, ms))
        }
        await timeout(1800000)

        let receiptIds = []
        for (let ticket of tickets) {
            if (ticket.id) {
                receiptIds.push(ticket.id)
            }
        }

        let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds)
        ;(async () => {
            for (let chunk of receiptIdChunks) {
                try {
                    let receipts = await expo.getPushNotificationReceiptsAsync(
                        chunk
                    )
                    console.log(receipts)
                    console.log('tickets')
                    console.log(tickets)

                    for (let receiptId in receipts) {
                        let { status, message, details } = receipts[receiptId]
                        if (status === 'ok') {
                            continue
                        } else if (status === 'error') {
                            console.error(
                                `There was an error sending a notification: ${message}`
                            )
                            if (details && details.error) {
                                console.error(
                                    `The error code is ${details.error}`
                                )
                                console.log(details.error)
                            }
                        }
                    }
                } catch (error) {
                    console.error(error)
                }
            }
        })()
    }
}

// setInterval(() => {
//     const minutes = moment().minute()
//     if (
//         (minutes >= 1 && minutes < 9) ||
//         (minutes >= 21 && minutes < 29) ||
//         (minutes >= 41 && minutes < 49)
//     )
//         initSend()
// }, 300000)
setInterval(initSend, 60000)
