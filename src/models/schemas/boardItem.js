const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const boardItemSchema = new mongoose.Schema(
    {
        itemType: String,
        item: String,
        details: {},
    },
    { minimize: false, _id: false, id: false }
)

module.exports = boardItemSchema
