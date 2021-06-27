const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const privatePaths = require('mongoose-private-paths')

const { mongoLength } = require('../config/fieldLength')
const basicVotes = require('./basicModel/basicVotes')
const { increaseVersion } = require('./plugins')

const commentSchema = new mongoose.Schema(
    {
        ...basicVotes,
        owner: String,
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
        isReply: Boolean,
        club: String,
        resource: String,
        resourceType: String,
    },
    { minimize: false }
)

commentSchema.plugin(mongoosePaginate)
commentSchema.plugin(privatePaths, { prefix: '-' })

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
