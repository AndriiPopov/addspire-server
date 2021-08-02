const mongoose = require('mongoose')

const countSchema = new mongoose.Schema({
    total: { type: Number, default: 0 },
    day: { type: Number, default: 0 },
    question: { type: String, required: true },
    questionName: { type: String, required: true },
    reputationDestribution: {},
})

countSchema.index({ question: 1 })

module.exports = mongoose.model('Count', countSchema)
