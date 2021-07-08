const dayjs = require('dayjs')
const { Expo } = require('expo-server-sdk')
const schedule = require('node-schedule')
const { Account } = require('../models')
const { accountService } = require('../services')

const expo = new Expo()

let allTickets = []
const sendNotifications = async (expo, messages) => {
    const chunks = expo.chunkPushNotifications(messages)
    const tickets = []
    chunks.forEach(async (chunk) => {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
            tickets.push(...ticketChunk)
        } catch (error) {
            console.error('error sending notifications', error)
        }
    })

    return tickets
}

exports.notify = async (accountsIds, message) => {
    const accounts = await Account.find({ _id: { $in: accountsIds } })
        .select('expoTokens')
        .lean()
        .exec()
    if (!accounts || !accounts.length) return

    const tokens = accounts.reduce(
        (result, value) => [...result, ...value.expoTokens],
        []
    )

    if (!tokens || !tokens.length) return

    const messages = []
    tokens.forEach((token) => {
        if (!Expo.isExpoPushToken(token)) {
            accountService.deleteNotificationToken(token)
        } else {
            messages.push({
                to: token,
                title: 'Test Title',
                body: 'Test body',
            })
        }
    })

    try {
        const tickets = await sendNotifications(expo, messages)
        const formattedTickets = tickets.map((ticket, idx) => {
            const formattedTicket = {}
            formattedTicket.status = ticket.status
            formattedTicket.expoPushToken = tokens[idx]
            if (ticket.id) formattedTicket.receiptId = ticket.id
            if (ticket.message) formattedTicket.message = ticket.message
            if (ticket.details) formattedTicket.details = ticket.details
            return formattedTicket
        })

        allTickets.push({ tickets: formattedTickets, date: dayjs() })
    } catch (error) {
        console.log('error', error)
    }
}

const checkTickets = async () => {
    const now = dayjs()

    const tickets = allTickets.filter((i) => now.diff(i.date, 'hour') >= 1)
    allTickets = allTickets.filter((i) => now.diff(i.date, 'hour') < 1)

    const receiptIds = []
    tickets.forEach((ticket) => {
        if (ticket.receiptId) receiptIds.push(ticket.receiptId)
    })

    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds)
    receiptIdChunks.forEach(async (chunk) => {
        try {
            const receipts = await expo.getPushNotificationReceiptsAsync(chunk)
            receipts.forEach((receiptId) => {
                const { status, message, details } = receipts[receiptId]
                if (status === 'error') {
                    console.error(
                        `There was an error sending a notification: ${message}`
                    )
                    if (details && details.error) {
                        console.error(`The error code is ${details.error}`)
                        if (details.error === 'DeviceNotRegistered') {
                            const token = tickets.find(
                                (ticket) => ticket.receiptId === receiptId
                            ).expoPushToken
                            accountService.deleteNotificationToken(token)
                        } else {
                            // Handle this separately. Maybe send them to an
                            // error tracking tool like Sentry
                        }
                    }
                }
            })
        } catch (error) {
            console.error(error)
        }
    })
}

schedule.scheduleJob('/10 * * * *', checkTickets)
