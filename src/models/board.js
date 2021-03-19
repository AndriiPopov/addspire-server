const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const boardItemSchema = require('./schemas/boardItem')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const suggestedChangeSchema = require('./schemas/suggestedChangeSchema')
const types = mongoose.Schema.Types

const boardSchema = new mongoose.Schema(
    {
        items: [
            {
                type: String,
                id: String,
            },
        ],
        itemsCount: {
            type: Number,
            default: 0,
        },
        settings: {},
        trend: { type: Number, default: 0 },
        likes: [String],
        saved: [String],
        name: {
            type: String,
            required: true,
            default: 'New goal',
            maxlength: mongoLength.name,
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
        images: [String],
        notifications: [notificationSchema],
        owner: String,
        posts: [String],
        sadmins: [String],
        admins: [String],
        collaborators: [String],
        structure: String,
        parent: String,
        description: {},
        shortDescription: String,
        suggestedChanges: [suggestedChangeSchema],
        appliedChanges: [suggestedChangeSchema],
        date: {
            type: Date,
            default: Date.now,
        },
        updated: {
            type: Date,
            default: Date.now,
        },
        version: { type: Number, default: 0 },
        suggestedChangesCount: { type: Number, default: 0 },
        saved: [String],
        savedCount: {
            type: Number,
            default: 0,
        },
        community: String,
        followers: [String],
        followersCount: {
            type: Number,
            default: 0,
        },
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
