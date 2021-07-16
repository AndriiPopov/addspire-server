const mongoose = require('mongoose')

const viewSchema = new mongoose.Schema({
    _id: { type: String },
    date: {
        type: Date,
        default: Date.now,
    },
})

viewSchema.index({ date: 1 }, { expireAfterSeconds: 86400 })

module.exports = mongoose.model('View', viewSchema)
