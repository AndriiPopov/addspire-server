const findMessage = (messages, id) => {
    for (let message of messages) {
        if (message._id.toString() === id.toString()) return message
        else if (message.replies.length) {
            const result = findMessage(message.replies, id)
            if (result) return result
        }
    }
}

module.exports = findMessage
