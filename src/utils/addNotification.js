var moment = require('moment')
const { System } = require('../models/system')
moment().format()

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
