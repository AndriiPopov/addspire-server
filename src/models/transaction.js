const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const rewardsSchema = require('./schemas/reward')

const types = mongoose.Types

const transactionSchema = new mongoose.Schema(
    {
        from: String,
        to: String,
        item: rewardsSchema,
        progress: String,
        progressId: String,
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
// transactionSchema.pre('save', function(next) {
//     this.increment()
//     return next()
// })
transactionSchema.plugin(updateIfCurrentPlugin)

transactionSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)
module.exports.Transaction = mongoose.model('Transaction', transactionSchema)
