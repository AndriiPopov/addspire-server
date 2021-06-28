const { mongoLength } = require('../../config/fieldLength')
const notificationSchema = require('../schemas/notification')
const basicTag = require('./basicTag')

module.exports = {
    tags: [basicTag],
    settings: {},
    name: {
        type: String,
    },
    image: String,
    notifications: [notificationSchema],
    date: {
        type: Date,
        default: Date.now,
    },
    editedDate: {
        type: Date,
    },
    followers: [String],
    views: Number,
    description: {
        type: String,
        maxlength: mongoLength.description.max,
        minlength: mongoLength.description.min,
    },
    followersCount: { type: Number, default: 0 },
}
