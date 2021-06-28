const mongoose = require('mongoose')
const privatePaths = require('mongoose-private-paths')
const { mongoLength } = require('../config/fieldLength')
const { increaseVersion } = require('./plugins')

const pluginSchema = new mongoose.Schema(
    {
        settings: {},
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
        updated: {
            type: Date,
            default: Date.now,
        },
        tags: [String],
        pluginType: { type: String, required: true, default: 'desc' },
        itemsCount: {
            type: Number,
            default: 0,
        },
        description: {},
        position: {},
        images: [String],
        structure: {},
        currentVersion: String,
    },
    { minimize: false }
)
pluginSchema.plugin(privatePaths, { prefix: '-' })

pluginSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports = mongoose.model('Plugin', pluginSchema)
