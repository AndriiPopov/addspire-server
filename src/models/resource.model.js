const mongoose = require('mongoose')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const mongoosePaginate = require('mongoose-paginate-v2')
const increaseVersion = require('./plugins/increaseVersion.plugin')
const basicModel = require('./basicModel/basicModel')
const boardItem = require('./schemas/boardItem')
const basicVotes = require('./basicModel/basicVotes')

const resourceSchema = new mongoose.Schema(
    {
        ...basicModel,
        ...basicVotes,
        owner: String,
        images: [String],
        plugins: [boardItem],
        club: String,
        wiki: Boolean,
        collaborators: [String],
        answers: [String],
        answersCount: { type: Number, default: 0 },
        resourceType: String,
        question: String,
        comments: [String],
        commentsCount: { type: Number, default: 0 },
        answered: [String],
        acceptedAnswer: {
            type: String,
            default: 'no',
        },
        bookmarksCount: { type: Number, default: 0 },
        vote: { type: Number, default: 0 },
    },
    { minimize: false }
)

resourceSchema.plugin(updateIfCurrentPlugin)
resourceSchema.plugin(mongoosePaginate)

resourceSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports = mongoose.model('Resource', resourceSchema)
