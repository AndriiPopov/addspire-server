const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')
const replySchema = require('./reply')

const messageSchema = new mongoose.Schema(
    {
        author: String,
        text: {},
        messageType: String,
        details: {},
        action: String,
        image: [String],
        date: {
            type: Date,
            default: Date.now,
        },
        editedDate: {
            type: Date,
            default: Date.now,
        },
        likes: [String],
        replies: [replySchema],
    },
    { minimize: false }
)

module.exports = messageSchema
