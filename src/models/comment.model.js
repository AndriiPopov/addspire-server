const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const { mongoLength } = require('../config/fieldLength')
const basicVotes = require('./basicModel/basicVotes')
const { increaseVersion } = require('./plugins')

const commentSchema = new mongoose.Schema(
    {
        ...basicVotes,
        reputation: { type: String, required: true },
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
        owner: { type: String, required: true },
        club: { type: String, required: true },
        isReply: Boolean,
        resource: { type: String, required: true },
        resourceType: { type: String, required: true },
        question: String,
    },
    { minimize: false }
)

// Club search and in profile search
commentSchema.index({
    reputation: 1,
    date: -1,
})

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
