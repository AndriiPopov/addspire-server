const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const basicVotes = require('./basicModel/basicVotes')
const { increaseVersion } = require('./plugins')
const { mongoLength } = require('../config/fieldLength')
const Image = require('./schemas/image.schema')

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
        editedBy: String,
        owner: { type: String, required: true },
        description: {
            type: String,
            maxlength: mongoLength.description.max,
            minlength: mongoLength.description.min,
            required: true,
        },
        reputation: { type: String, required: true },
        images: [Image],
        club: { type: String, required: true },
        question: { type: String, required: true },
        comments: [String],
        commentsCount: { type: Number, default: 0 },
    },
    { minimize: false }
)

// Profile search
answerSchema.index({
    reputation: 1,
    date: -1,
})

// Question search
answerSchema.index({
    question: 1,
    vote: -1,
})

answerSchema.plugin(mongoosePaginate)
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
