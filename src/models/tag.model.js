const mongoose = require('mongoose')
const { mongoLength } = require('../config/fieldLength')

const tagSchema = new mongoose.Schema({
    _id: {
        type: String,
        maxlength: mongoLength.tag.max,
        minlength: mongoLength.tag.min,
    },
    length: Number,
})

module.exports = mongoose.model('Tag', tagSchema)
