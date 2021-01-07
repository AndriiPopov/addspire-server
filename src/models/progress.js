const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const progressRewardSchema = require('./schemas/progressReward')
const types = mongoose.Schema.Types

const progressSchema = new mongoose.Schema(
    {
        posts: [String],
        owner: String,
        status: {
            type: String,
            default: 'process',
        },
        currentId: {
            type: Number,
            default: 0,
            required: true,
        },
        admins: [String],
        settings: {},
        notifications: [notificationSchema],
        views: { type: Number, default: 0 },
        likes: [String],
        followingAccounts: [String],
        name: {
            type: String,
            required: true,
            default: 'New goal',
            maxlength: mongoLength.name,
        },
        startDescription: {},
        startDate: {
            type: Date,
        },
        startImages: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
        finishDescription: {},
        finishDate: {
            type: Date,
        },
        finishImages: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
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
        dueDate: {
            type: Date,
            default: () => new Date(+new Date() + 7 * 24 * 60 * 60 * 1000),
            required: true,
        },
        privacy: {
            type: String,
            enum: ['public', 'private'],
            required: true,
            default: 'public',
        },
        rewards: [progressRewardSchema],
        oldRewards: [progressRewardSchema],
        position: {},
        nomap: Boolean,
        category: [String],
        activities: [String],
        oldActivities: [String],
    },
    { minimize: false }
)

progressSchema.index({ position: '2dsphere' })
progressSchema.plugin(updateIfCurrentPlugin)

progressSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Progress = mongoose.model('Progress', progressSchema)
module.exports.progressSchema = progressSchema
