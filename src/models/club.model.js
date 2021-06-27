const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const privatePaths = require('mongoose-private-paths')
const basicModel = require('./basicModel/basicModel')
const { mongoLength } = require('../config/fieldLength')
const { increaseVersion } = require('./plugins')

const clubSchema = new mongoose.Schema(
    {
        ...basicModel,
        reputations: [
            {
                accountId: { type: String, required: true },
                reputationId: { type: String, required: true },
                admin: Boolean,
            },
        ],
        reputationsCount: {
            type: Number,
            default: 0,
        },
        adminReputations: [
            {
                accountId: { type: String, required: true },
                reputationId: { type: String, required: true },
            },
        ],
        adminsCount: {
            type: Number,
            default: 0,
        },
        banned: [String],
        questions: [String],
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
    },
    { minimize: false }
)

clubSchema.plugin(mongoosePaginate)
clubSchema.plugin(privatePaths, { prefix: '-' })

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
