const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const progressRewardSchema = new mongoose.Schema(
    {
        rewardId: String,
        reward: String,
        owner: String,
        activities: [String],
        repeat: String,
        users: [String],
    },
    { minimize: false, _id: false, id: false }
)

module.exports = progressRewardSchema
