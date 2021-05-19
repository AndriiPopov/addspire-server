const mongoose = require('mongoose')

const inviteSchema = new mongoose.Schema(
    {
        by: String,
        date: {
            type: Date,
            default: Date.now,
        },
        link: String,
    },
    { minimize: false }
)

module.exports = inviteSchema
