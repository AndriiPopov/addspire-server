const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const boardItemSchema = require('./schemas/boardItem')
const suggestedChangeSchema = require('./schemas/suggestedChangeSchema')
const types = mongoose.Schema.Types

const structureSchema = new mongoose.Schema(
    {
        items: boardItemSchema,
        notifications: [notificationSchema],
        owner: String,
        posts: [String],
        sadmins: [String],
        admins: [String],
        collaborators: [String],
        structure: String,
        parent: String,
        description: {},
        shortDescription: String,
        suggestedChanges: [suggestedChangeSchema],
        appliedChanges: [suggestedChangeSchema],
        date: {
            type: Date,
            default: Date.now,
        },
        updated: {
            type: Date,
            default: Date.now,
        },
        version: { type: Number, default: 0 },
        suggestedChangesCount: { type: Number, default: 0 },
        saved: [String],
        savedCount: {
            type: Number,
            default: 0,
        },
        community: String,
    },
    { minimize: false }
)

// versionSchema.index({ position: '2dsphere' })
structureSchema.plugin(updateIfCurrentPlugin)

structureSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Structure = mongoose.model('Structure', structureSchema)
module.exports.structureSchema = structureSchema
