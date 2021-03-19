const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const replySchema = new mongoose.Schema(
    {
        author: String,
        text: { type: String, maxlength: mongoLength.message },
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
        replies: [],
    },
    { minimize: false }
)

module.exports = replySchema
