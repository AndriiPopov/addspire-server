const mongoose = require('mongoose')

const imageDataSchema = new mongoose.Schema({
    url: { type: String, required: true },
    votesDownCount: { type: Number, default: 0 },
    votesUpCount: { type: Number, default: 0 },
    votesUp: [String],
    votesDown: [String],
    comments: [String],
    commentsCount: { type: Number, default: 0 },
    question: { type: String, required: true },
    club: { type: String, required: true },
    date: { type: Date, default: Date.now },
    owner: { type: String, required: true },
})

module.exports = mongoose.model('ImageData', imageDataSchema)
