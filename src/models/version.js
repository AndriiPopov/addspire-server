const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const types = mongoose.Schema.Types

const versionSchema = new mongoose.Schema(
    {
        course: String,
        owner: String,
        steps: [String],
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
        description: {},
        descriptionText: {
            type: String,
            default: '',
            maxlength: mongoLength.description,
        },
        structure: String,
        published: {
            type: Boolean,
            default: false,
        },
        images: [String],
        category: [String],
    },
    { minimize: false }
)

// versionSchema.index({ position: '2dsphere' })
versionSchema.plugin(updateIfCurrentPlugin)

versionSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Version = mongoose.model('Version', versionSchema)
module.exports.versionSchema = versionSchema
