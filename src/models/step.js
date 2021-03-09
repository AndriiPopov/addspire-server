const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const stageSchema = require('./schemas/stage')
const types = mongoose.Schema.Types
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const notificationSchema = require('./schemas/notification')

const stepSchema = new mongoose.Schema(
    {
        likes: [String],
        name: {
            type: String,
            required: true,
            default: 'New goal',
            maxlength: mongoLength.name,
        },
        description: {},
        images: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
        repeat: String,
        days: [String],
    },
    { minimize: false }
)

stepSchema.plugin(updateIfCurrentPlugin)

stepSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Step = mongoose.model('Step', stepSchema)
