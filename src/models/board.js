const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const boardItemSchema = require('./schemas/boardItem')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const types = mongoose.Schema.Types

const boardSchema = new mongoose.Schema(
    {
        posts: [String],
        sadmins: [String],
        admins: [String],
        collaborators: [String],
        items: [String],
        itemsCount: {
            type: Number,
            default: 0,
        },
        pendingVersions: [String],
        settings: {},
        notifications: [notificationSchema],
        trend: { type: Number, default: 0 },
        likes: [String],
        saved: [String],
        name: {
            type: String,
            required: true,
            default: 'New goal',
            maxlength: mongoLength.name,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        description: {},
        descriptionText: {
            type: String,
            default: '',
            maxlength: mongoLength.description,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        updated: {
            type: Date,
            default: Date.now,
        },
        image: String,
        likesCount: {
            type: Number,
            default: 0,
        },
        savedCount: {
            type: Number,
            default: 0,
        },
        structure: String,
        images: [String],
        owner: String,
    },
    { minimize: false }
)

boardSchema.plugin(updateIfCurrentPlugin)

boardSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Board = mongoose.model('Board', boardSchema)
module.exports.boardSchema = boardSchema
