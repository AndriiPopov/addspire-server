const mongoose = require('mongoose')

const suggestedChangeSchema = new mongoose.Schema(
    {
        suggested: String,
        action: String,
        key: String,
        resourceId: String,
        resourceType: String,
        value: {},
        details: {},
        date: {
            type: Date,
            default: Date.now,
        },
        applied: {
            type: Date,
            default: Date.now,
        },
        messages: [String],
        approved: Boolean,
        votesUp: {
            type: Number,
            default: 0,
        },
        votesDown: {
            type: Number,
            default: 0,
        },
    },
    { minimize: false }
)

module.exports = suggestedChangeSchema
