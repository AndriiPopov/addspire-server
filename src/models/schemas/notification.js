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
    },
    { minimize: false, _id: false, id: false }
)

module.exports = notificationSchema
