const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const stepSchema = require('./schemas/step')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const suggestedChangeSchema = require('./schemas/suggestedChangeSchema')
const types = mongoose.Schema.Types

const adviceSchema = new mongoose.Schema(
    {
        users: [String],
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
        images: [String],
        progresses: [String],
        progressesCount: {
            type: Number,
            default: 0,
        },
        likesCount: {
            type: Number,
            default: 0,
        },
        followers: [String],
        followersCount: {
            type: Number,
            default: 0,
        },
        savedCount: {
            type: Number,
            default: 0,
        },
        usersCount: {
            type: Number,
            default: 0,
        },
        steps: [stepSchema],
        category: [String],
        notifications: [notificationSchema],
        owner: String,
        posts: [String],
        sadmins: [String],
        admins: [String],
        collaborators: [String],
        structure: String,
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
        confirmed: [
            {
                date: {
                    type: Date,
                    default: Date.now,
                },
                user: String,
            },
        ],
    },
    { minimize: false }
)

adviceSchema.plugin(updateIfCurrentPlugin)

adviceSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Advice = mongoose.model('Advice', adviceSchema)
module.exports.adviceSchema = adviceSchema
