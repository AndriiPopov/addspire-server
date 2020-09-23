const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const rewardsSchema = new mongoose.Schema(
    {
        mode: {
            type: String,
            enum: ['simple', 'money', 'item'],
        },
        simple: { type: String, maxlength: mongoLength.description },
        money: Number,
        itemName: { type: String, maxlength: mongoLength.name },
        itemDescription: { type: String, maxlength: mongoLength.description },
        itemImages: [String],
        owner: String,
        for: [String],
        rewardId: String,
    },
    { minimize: false, _id: false, id: false }
)

module.exports = rewardsSchema
