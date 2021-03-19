const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const types = mongoose.Schema.Types
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const notificationSchema = require('./schemas/notification')

const progressSchema = new mongoose.Schema(
    {
        advice: String,
        version: String,
        progressSteps: [String],
        owner: String,
        position: {},
        nomap: Boolean,
        status: { type: String, default: 'process' },
        notifications: [notificationSchema],
        date: {
            type: Date,
            default: Date.now,
        },
        updated: {
            type: Date,
            default: Date.now,
        },
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
