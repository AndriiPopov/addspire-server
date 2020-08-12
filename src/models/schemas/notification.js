const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

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
    },
    { minimize: false, _id: false, id: false }
)

module.exports = notificationSchema
