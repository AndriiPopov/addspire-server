const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')
const notificationSchema = require('./schemas/notification')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const boardItemSchema = require('./schemas/boardItem')
const types = mongoose.Schema.Types

const structureSchema = new mongoose.Schema(
    {
        structure: {},
        items: boardItemSchema,
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
