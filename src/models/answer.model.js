const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const privatePaths = require('mongoose-private-paths')
const basicVotes = require('./basicModel/basicVotes')
const { increaseVersion } = require('./plugins')
const { mongoLength } = require('../config/fieldLength')

const answerSchema = new mongoose.Schema(
    {
        ...basicVotes,
        date: {
            type: Date,
            default: Date.now,
        },
        editedDate: {
            type: Date,
        },
        description: {
            type: String,
            maxlength: mongoLength.description.max,
            minlength: mongoLength.description.min,
        },
        owner: String,
        reputation: String,
        images: [String],
        club: String,
        wiki: Boolean,
        collaborators: [String],
        question: String,
        comments: [String],
        commentsCount: { type: Number, default: 0 },
    },
    { minimize: false }
)

answerSchema.plugin(mongoosePaginate)
answerSchema.plugin(privatePaths, { prefix: '-' })
answerSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports = mongoose.model('Answer', answerSchema)
