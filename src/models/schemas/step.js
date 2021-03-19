const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')
const types = mongoose.Schema.Types
const increaseVersion = require('../../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const notificationSchema = require('./notification')

const stepSchema = new mongoose.Schema(
    {
        likes: [String],
        name: {
            type: String,
            required: true,
            default: 'New goal',
            maxlength: mongoLength.name,
        },
        images: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
        repeat: String,
        days: [String],
        notifications: [notificationSchema],
        owner: String,
        pendingVersions: [String],
        structure: String,
        description: {},
        date: {
            type: Date,
            default: Date.now,
        },
        pending: {
            type: Boolean,
            default: true,
        },
    },
    { minimize: false }
)

module.exports = stepSchema
