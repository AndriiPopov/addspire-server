const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const stageSchema = require('./schemas/stage')
const types = mongoose.Schema.Types
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const notificationSchema = require('./schemas/notification')

const activitySchema = new mongoose.Schema(
    {
        stages: [stageSchema],
        status: String,
        likes: [String],
        followingAccounts: [String],
        name: {
            type: String,
            required: true,
            default: 'New goal',
            maxlength: mongoLength.name,
        },
        description: {},
        descriptionText: {
            type: String,
            default: '',
            maxlength: mongoLength.description,
        },
        images: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
        rewards: [String],
        goals: [String],
        repeat: String,
        days: [String],
        position: {},
        nomap: Boolean,
        category: [String],
        owner: String,
        posts: [String],
        users: [String],
        currentId: {
            type: Number,
            default: 0,
            required: true,
        },
        views: { type: Number, default: 0 },
        notifications: [notificationSchema],
    },
    { minimize: false }
)
activitySchema.index({ position: '2dsphere' })

activitySchema.plugin(updateIfCurrentPlugin)

activitySchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Activity = mongoose.model('Activity', activitySchema)
