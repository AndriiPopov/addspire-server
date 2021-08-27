const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const basicModel = require('./basicModel/basicModel')
const { mongoLength } = require('../config/fieldLength')
const { increaseVersion } = require('./plugins')

const clubSchema = new mongoose.Schema(
    {
        ...basicModel,
        reputationsCount: {
            type: Number,
            default: 0,
        },
        adminReputations: [String],
        adminsCount: {
            type: Number,
            default: 0,
        },
        questionsCount: {
            type: Number,
            default: 0,
        },
        startConversation: {
            type: String,
            default: 'any',
        },
        residenceRequests: [
            {
                accountId: String,
                reputationId: String,
                message: {
                    type: String,
                    maxlength: mongoLength.message.max,
                    minlength: mongoLength.message.min,
                    required: true,
                },
                contact: {
                    type: String,
                    maxlength: mongoLength.message.max,
                    minlength: mongoLength.message.min,
                    required: true,
                },
            },
        ],
        banned: [String],
    },
    { minimize: false }
)

// General search
clubSchema.index({
    tags: 1,
})

clubSchema.index({
    name: 'text',
})

// For sorting
clubSchema.index({
    reputationsCount: -1,
})

clubSchema.plugin(mongoosePaginate)

clubSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports = mongoose.model('Club', clubSchema)
