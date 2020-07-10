const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const types = mongoose.Types

const transactionSchema = new mongoose.Schema(
    {
        from: String,
        to: String,
        item: {},
        progress: String,
        amount: {
            type: Number,
            default: 0,
            min: 0,
        },
        date: {
            type: Date,
            default: Date.now,
            required: true,
        },
        status: String,
    },
    { minimize: false }
)

module.exports.Transaction = mongoose.model('Transaction', transactionSchema)
