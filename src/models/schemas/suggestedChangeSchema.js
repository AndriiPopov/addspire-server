const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')
const types = mongoose.Schema.Types

const suggestedChangeSchema = new mongoose.Schema(
    {
        suggested: String,
        action: String,
        key: String,
        resourceId: String,
        value: {},
        resourceType: String,
        details: {},
        date: {
            type: Date,
            default: Date.now,
        },
        applied: {
            type: Date,
            default: Date.now,
        },
        comment: String,
        adminComment: String,
        approved: Boolean,
        post: String,
    },
    { minimize: false }
)

module.exports = suggestedChangeSchema
