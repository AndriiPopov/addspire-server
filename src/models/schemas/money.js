const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const moneySchema = new mongoose.Schema(
    {
        user: String,
        amount: { type: Number, min: 0, default: 0 },
    },

    { minimize: false, _id: false, id: false }
)

module.exports = moneySchema
