module.exports = (el, notification, myNot, bothNot) => {
    if (!myNot || bothNot) {
        el.notifications.unshift(notification)
        if (el.notifications.length > 20) el.notifications.pop()
    }
    if (myNot || bothNot) {
        el.myNotifications.unshift(notification)
        if (el.myNotifications.length > 40) el.myNotifications.pop()
    }
}
