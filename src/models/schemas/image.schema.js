const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema(
    {
        dataId: { type: String, required: true },
        url: { type: String, required: true },
    },
    { minimize: false }
)

module.exports = imageSchema
