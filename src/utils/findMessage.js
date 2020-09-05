const findMessage = (messages, id) => {
    for (let message of messages) {
        if (message.messageId === id) return message
        else if (message.replies.length) {
            const result = findMessage(message.replies, id)
            if (result) return result
        }
    }
}

module.exports = findMessage
