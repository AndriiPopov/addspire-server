const { mongoLength } = require('../../config/fieldLength')
const basicTag = require('./basicTag')

module.exports = {
    tags: [basicTag],
    settings: {},
    name: {
        type: String,
        default: '',
    },
    image: { type: String, default: '' },
    date: {
        type: Date,
        default: Date.now,
    },
    editedDate: {
        type: Date,
    },
    editedBy: String,
    followers: [String],
    description: {
        type: String,
        maxlength: mongoLength.description.max,
        minlength: mongoLength.description.min,
    },
    followersCount: { type: Number, default: 0 },
}
