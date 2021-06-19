const mongoose = require('mongoose')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const increaseVersion = require('./plugins/increaseVersion.plugin')
const basicModel = require('./basicModel/basicModel')
const { mongoLength } = require('../config/fieldLength')

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
        questions: [String],
        questionsCount: {
            type: Number,
            default: 0,
        },
        articles: [String],
        articlesCount: {
            type: Number,
            default: 0,
        },

        responseTime: Number,
        startConversation: {
            type: String,
            default: 'any',
        },
        residenceRequests: [
            {
                accountId: String,
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
clubSchema.plugin(updateIfCurrentPlugin)

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
