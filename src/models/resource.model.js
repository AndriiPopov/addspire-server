const mongoose = require('mongoose')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const increaseVersion = require('./plugins/increaseVersion.plugin')
const basicModel = require('./basicModel/basicModel')
const boardItem = require('./schemas/boardItem')

const resourceSchema = new mongoose.Schema(
    {
        ...basicModel,
        owner: String,
        plugins: [boardItem],
        club: String,
        wiki: Boolean,
        collaborators: [String],
        answers: [String],
        resourceType: String,
        question: String,
        messages: [String],
        votesUp: [String],
        votesDown: [String],
        answered: [String],
        acceptedAnswer: {
            type: String,
            default: 'no',
        },
    },
    { minimize: false }
)

resourceSchema.plugin(updateIfCurrentPlugin)

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

module.exports.Resource = mongoose.model('Resource', resourceSchema)
module.exports.resourceSchema = resourceSchema
