const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const basicModel = require('./basicModel/basicModel')
const basicVotes = require('./basicModel/basicVotes')
const { increaseVersion } = require('./plugins')

const questionSchema = new mongoose.Schema(
    {
        ...basicModel,
        ...basicVotes,
        owner: { type: String, required: true },
        reputation: { type: String, required: true },
        images: [String],
        club: { type: String, required: true },
        answersCount: { type: Number, default: 0 },
        comments: [String],
        commentsCount: { type: Number, default: 0 },
        answered: [String],
        acceptedAnswer: {
            type: String,
            default: 'no',
        },
        acceptedAnswerOwner: String,
        count: { type: String, required: true },
        bonusCoins: Number,
        bonusPaid: { type: Boolean, default: false },
        bonusPending: { type: Boolean, default: false },
        bonusCreatedDate: Date,
    },
    { minimize: false }
)

// General search
questionSchema.index({
    tags: 1,
})

questionSchema.index({
    name: 'text',
})

// Club search
questionSchema.index({
    club: 1,
    tags: 1,
})

questionSchema.index({
    club: 1,
    name: 'text',
})

// Profile search
questionSchema.index({
    reputation: 1,
})

// For sorting
questionSchema.index({
    vote: -1,
})

questionSchema.index({
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
