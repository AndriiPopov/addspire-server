const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')

const types = mongoose.Types

const transactionSchema = new mongoose.Schema(
    {
        from: String,
        to: String,
        reward: String,
        rewardName: String,
        rewardImages: [String],
        progress: String,
        progressId: String,
        activity: String,
        activityId: String,
        date: {
            type: Date,
            default: Date.now,
            required: true,
        },
        status: String,
        quantity: Number,
        stage: {},
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
