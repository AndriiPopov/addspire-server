const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const privatePaths = require('mongoose-private-paths')
const basicModel = require('./basicModel/basicModel')
const { increaseVersion } = require('./plugins')

const reputationSchema = new mongoose.Schema(
    {
        ...basicModel,
        club: { type: String, index: true },
        owner: { type: String, index: true },
        reputation: { type: Number, default: 0 },
        plusToday: { type: Number, default: 0 },
        minusToday: { type: Number, default: 0 },
        admin: { type: Boolean, default: false },
        invitedBy: String,
        userSince: {
            type: Date,
            default: Date.now,
        },
        adminSince: {
            type: Date,
            default: Date.now,
        },
        banned: Boolean,
        bannedUntil: { type: Date },
        questions: [String],
        answers: [String],
        comments: [String],
        gains: [
            {
                reputation: Number,
                resourceId: String,
                resourceType: String,
                actionType: String,
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        reputationHistory: [
            {
                reputation: Number,
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { minimize: false }
)

reputationSchema.plugin(mongoosePaginate)
reputationSchema.plugin(privatePaths, { prefix: '-' })
reputationSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports = mongoose.model('Reputation', reputationSchema)
