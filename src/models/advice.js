const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const types = mongoose.Schema.Types

const adviceSchema = new mongoose.Schema(
    {
        posts: [String],
        sadmins: [String],
        admins: [String],
        collaborators: [String],
        versions: [String],
        currentVersion: String,
        pendingVersions: [String],
        users: [String],
        currentUsers: [String],
        finishedUsers: [String],
        settings: {},
        notifications: [notificationSchema],
        trend: { type: Number, default: 0 },
        likes: [String],
        saved: [String],
        owner: String,
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
        updated: {
            type: Date,
            default: Date.now,
        },
        derivedAdvices: [String],
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
        savedCount: {
            type: Number,
            default: 0,
        },
        usersCount: {
            type: Number,
            default: 0,
        },
        structure: String,
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
