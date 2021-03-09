const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const stageSchema = new mongoose.Schema(
    {
        stageId: String,
        status: String,
        old: Boolean,
        year: Number,
        month: Number,
        week: Number,
        day: Number,
        repeat: String,
    },
    { minimize: false, _id: false, id: false }
)

module.exports = stageSchema
