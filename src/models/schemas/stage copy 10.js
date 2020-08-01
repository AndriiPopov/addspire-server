const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const stageSchema = new mongoose.Schema(
    {
        milestoneId: { type: String, required: true },
        approvedBy: [
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
    },
    { minimize: false, _id: false, id: false }
)

module.exports = stageSchema
