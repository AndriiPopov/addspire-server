const mongoose = require('mongoose')
const { mongoLength } = require('../config/fieldLength')

const tagSchema = new mongoose.Schema({
    _id: {
        type: String,
        maxlength: mongoLength.tag.max,
        minlength: mongoLength.tag.min,
        count: {
            type: Number,
            default: 1,
        },
    },
    length: Number,
})

tagSchema.index({ _id: 1, count: -1 })

module.exports = mongoose.model('Tag', tagSchema)
