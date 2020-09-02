const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')
const rewardsSchema = require('./reward')

const stageSchema = new mongoose.Schema(
    {
        stageId: String,
        approvedBy: [
            {
                accountId: String,
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        failBy: [
            {
                accountId: String,
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        paid: [rewardsSchema],
        status: String,
        dismissed: Boolean,
        old: Boolean,
        year: Number,
        month: Number,
        week: Number,
        day: Number,
    },
    { minimize: false, _id: false, id: false }
)

module.exports = stageSchema
