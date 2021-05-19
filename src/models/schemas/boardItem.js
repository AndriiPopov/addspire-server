const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema(
    {
        itemId: String,
        itemType: String,
        details: {},
    },
    { minimize: false }
)

module.exports = itemSchema
