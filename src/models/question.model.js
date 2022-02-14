const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const { mongoLength } = require('../config/fieldLength')
const basicModel = require('./basicModel/basicModel')
const basicVotes = require('./basicModel/basicVotes')
const { increaseVersion } = require('./plugins')
const Image = require('./schemas/image.schema')

const questionSchema = new mongoose.Schema(
    {
        ...basicModel,
        ...basicVotes,
        name: {
            type: String,
            maxlength: mongoLength.questionName.max,
            minlength: mongoLength.questionName.min,
            required: true,
        },
        owner: { type: String, required: true },
        reputation: { type: String, required: true },
        images: [Image],
        club: { type: String, required: true },
        answersCount: { type: Number, default: 0 },
        comments: [String],
        commentsCount: { type: Number, default: 0 },
        answered: [String],
        acceptedAnswer: {
            type: String,
            default: 'no',
        },
        acceptedAnswerOwner: { type: String, default: '' },
        count: { type: String, required: true },
        location: {
            type: { type: String },
            coordinates: [Number],
        },
        global: { type: Boolean, default: false },
        bestAnswer: String,
        post: { type: Boolean, default: false },
    },
    { minimize: false }
)

// General search
questionSchema.index(
    { post: 1, tags: 1, vote: -1 },
    { partialFilterExpression: { global: true } }
)

questionSchema.index({
    post: 1,
    location: '2dsphere',
    tags: 1,
    vote: -1,
})

questionSchema.index({
    post: 1,
    location: '2dsphere',
    date: -1,
})

questionSchema.index(
    { post: 1, date: -1 },
    { partialFilterExpression: { global: true } }
)

// Club search
questionSchema.index({
    post: 1,
    club: 1,
    tags: 1,
    vote: -1,
})

questionSchema.index({
    post: 1,
    club: 1,
    date: 1,
})

// Profile search
questionSchema.index({
    post: 1,
    reputation: 1,
    date: -1,
})

// My questions search
questionSchema.index({
    post: 1,
    owner: 1,
    date: -1,
})

questionSchema.plugin(mongoosePaginate)
questionSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports = mongoose.model('Question', questionSchema)
