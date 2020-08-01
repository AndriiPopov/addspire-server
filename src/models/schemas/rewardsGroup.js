const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')
const rewardsSchema = require('./reward')

const rewardsGroupSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, maxlength: mongoLength.id },
        rewards: [rewardsSchema],
        currentId: { type: Number, default: 0 },
    },
    { minimize: false, _id: false, id: false }
)

module.exports = rewardsGroupSchema
