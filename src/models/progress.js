const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const stageSchema = require('./schemas/stage')
const goalSchema = require('./schemas/goal')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const types = mongoose.Schema.Types

const progressSchema = new mongoose.Schema(
    {
        posts: [String],
        owner: String,
        stages: [stageSchema],
        status: String,
        goal: goalSchema,
        currentId: {
            type: Number,
            default: 0,
            required: true,
        },
        admins: [String],
        settings: {},
        notifications: [notificationSchema],
        name: { type: String, index: true },
        views: { type: Number, default: 0 },
        likes: [String],
        followingAccounts: [String],
    },
    { minimize: false }
)
// progressSchema.pre('save', function(next) {
//     this.increment()
//     return next()
// })
progressSchema.index({ 'goal.position': '2dsphere' })
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
