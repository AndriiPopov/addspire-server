const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
    {
        user: String,
        object: String,
        text: String,
        code: String,
        details: {},
        link: String,
        date: { type: Date, default: Date.now, required: true },
        notId: String,
        seen: { type: Boolean, default: false },
        questionId: String,
    },
    { minimize: false, _id: false, id: false }
)

module.exports = notificationSchema
