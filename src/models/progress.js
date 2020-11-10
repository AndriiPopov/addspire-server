const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const stageSchema = require('./schemas/stage')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const types = mongoose.Schema.Types

const progressSchema = new mongoose.Schema(
    {
        posts: [String],
        owner: String,
        stages: [stageSchema],
        status: String,
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
        privacy: {
            type: String,
            enum: ['public', 'private'],
            required: true,
            default: 'public',
        },
        users: [String],
        rewards: [String],
        repeat: String,
        days: [String],
        position: {},
        nomap: Boolean,
        category: [String],
    },
    { minimize: false }
)
// progressSchema.pre('save', function(next) {
//     this.increment()
//     return next()
// })
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
