const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const messageSchema = new mongoose.Schema(
    {
        author: String,
        text: { type: String, maxlength: mongoLength.message },
        action: String,
        image: String,
        date: {
            type: Date,
            default: Date.now,
        },
        editedDate: {
            type: Date,
            default: Date.now,
        },
        likes: [String],
        replies: [
            {
                author: String,
                text: { type: String, maxlength: mongoLength.message },
                action: String,
                image: String,
                date: {
                    type: Date,
                    default: Date.now,
                },
                editedDate: {
                    type: Date,
                    default: Date.now,
                },
                likes: [String],
                replies: [],
                messageId: { type: String, required: true },
            },
        ],
        messageId: { type: String, required: true },
    },
    { minimize: false, _id: false, id: false }
)

module.exports = messageSchema
