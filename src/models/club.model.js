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
            },
        ],
        banned: [String],
        fresh: { type: Boolean, default: true },
        location: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
            },
        },
        clubAddress: { type: String, default: '' },
        global: { type: Boolean, default: false },
        images: [String],
    },
    { minimize: false }
)

// General search
clubSchema.index(
    {
        tags: 1,
        followersCount: -1,
    },
    {
        partialFilterExpression: { global: true },
    }
)

clubSchema.index({
    location: '2dsphere',
    tags: 1,
    followersCount: -1,
})

clubSchema.index({
    location: '2dsphere',
    followersCount: -1,
})

clubSchema.index(
    { followersCount: -1 },
    { partialFilterExpression: { global: true } }
)

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
