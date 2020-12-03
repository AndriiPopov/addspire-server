const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')

const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const notificationSchema = require('./schemas/notification')

const types = mongoose.Types

const rewardSchema = new mongoose.Schema(
    {
        name: { type: String, maxlength: mongoLength.name },
        description: {},
        descriptionText: String,
        images: [String],
        owner: String,
        progresses: [String],
        posts: [String],
        likes: [String],
        followingAccounts: [String],
        wish: Boolean,
        views: { type: Number, default: 0 },
        category: [String],
        notifications: [notificationSchema],
        position: {},
        nomap: Boolean,
    },
    { minimize: false }
)
rewardSchema.index({ position: '2dsphere' })

rewardSchema.plugin(updateIfCurrentPlugin)

rewardSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Reward = mongoose.model('Reward', rewardSchema)
