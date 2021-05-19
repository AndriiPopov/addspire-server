const mongoose = require('mongoose')

const reputationHistorySchema = new mongoose.Schema(
    {
        resource: String,
        recieved: Boolean,
        quantity: Number,
    },
    { minimize: false }
)
module.exports = reputationHistorySchema
