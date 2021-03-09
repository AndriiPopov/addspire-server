const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const stageSchema = require('./schemas/stage')
const types = mongoose.Schema.Types
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')

const progressStepSchema = new mongoose.Schema(
    {
        stages: [stageSchema],
        step: String,
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
        currentId: {
            type: Number,
            default: 0,
            required: true,
        },
        status: String,
        progress: String,
        date: {
            type: Date,
        },
    },
    { minimize: false }
)

progressStepSchema.plugin(updateIfCurrentPlugin)

progressStepSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.ProgressStep = mongoose.model('ProgressStep', progressStepSchema)
