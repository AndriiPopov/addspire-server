const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const types = mongoose.Schema.Types

const groupSchema = new mongoose.Schema(
    {
        posts: [String],
        admins: [String],
        currentId: {
            type: Number,
            default: 0,
            required: true,
        },
        users: [String],
        notifications: [notificationSchema],
        settings: {},
        progresses: [String],
        description: { type: String, default: 'Description of the group' },
        name: { type: String, default: 'New group' },
        active: { type: Boolean, default: false },
        images: [String],
    },
    { minimize: false }
)

groupSchema.plugin(updateIfCurrentPlugin)

groupSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Group = mongoose.model('Group', groupSchema)
