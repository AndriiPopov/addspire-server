const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const basicModel = require('./basicModel/basicModel')
const basicVotes = require('./basicModel/basicVotes')
const { increaseVersion } = require('./plugins')

const questionSchema = new mongoose.Schema(
    {
        ...basicModel,
        ...basicVotes,
        owner: String,
        reputation: String,
        images: [String],
        club: String,
        answersCount: { type: Number, default: 0 },
        comments: [String],
        commentsCount: { type: Number, default: 0 },
        answered: [String],
        acceptedAnswer: {
            type: String,
            default: 'no',
        },
    },
    { minimize: false }
)

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
