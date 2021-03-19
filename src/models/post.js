const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const messageSchema = require('./schemas/message')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const types = mongoose.Schema.Types

const postSchema = new mongoose.Schema(
    {
        messages: [messageSchema],
        notifications: [notificationSchema],
        users: [String],
        parent: {
            parentId: String,
            parentType: String,
        },
    },
    { minimize: false }
)

postSchema.plugin(updateIfCurrentPlugin)

postSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Post = mongoose.model('Post', postSchema)
