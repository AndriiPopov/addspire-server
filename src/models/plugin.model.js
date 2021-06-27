const mongoose = require('mongoose')
const privatePaths = require('mongoose-private-paths')
const boardItemSchema = require('./schemas/boardItem')
const suggestedChangeSchema = require('./schemas/suggestedChangeSchema')
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
        edits: [suggestedChangeSchema],
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
        items: [boardItemSchema],
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
