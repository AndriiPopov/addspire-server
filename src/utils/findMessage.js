const { find } = require('lodash')

const findMessage = (messages, id) => {
    for (let message of messages) {
        if (message.messageId === id) return message
        else if (message.replies.length) {
            const result = findMessage(message.replies, id)
            if (result) return result
        }
    }
    // return messages.find(
    //     message => message.messageId === id || findMessage(message.replies, id)
    // )
}

module.exports = findMessage
