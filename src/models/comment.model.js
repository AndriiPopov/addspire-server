const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const { mongoLength } = require('../config/fieldLength')
const basicVotes = require('./basicModel/basicVotes')
const { increaseVersion } = require('./plugins')

const commentSchema = new mongoose.Schema(
    {
        ...basicVotes,
        reputation: String,
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
        owner: String,
        club: String,
        isReply: Boolean,
        resource: String,
        resourceType: String,
    },
    { minimize: false }
)

commentSchema.plugin(mongoosePaginate)

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
