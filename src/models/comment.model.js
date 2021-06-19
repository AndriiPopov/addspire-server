const mongoose = require('mongoose')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const increaseVersion = require('./plugins/increaseVersion.plugin')
const { mongoLength } = require('../config/fieldLength')
const basicVotes = require('./basicModel/basicVotes')

const commentSchema = new mongoose.Schema(
    {
        ...basicVotes,
        owner: String,
        text: {
            type: String,
            maxlength: mongoLength.message.max,
            minlength: mongoLength.message.min,
            required: true,
        },
        images: [String],
        date: {
            type: Date,
            default: Date.now,
        },
        editedDate: {
            type: Date,
        },
        isReply: Boolean,
        club: String,
        resource: String,
    },
    { minimize: false }
)

commentSchema.plugin(updateIfCurrentPlugin)

commentSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports = mongoose.model('Comment', commentSchema)
