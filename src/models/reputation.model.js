const mongoose = require('mongoose')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const increaseVersion = require('./plugins/increaseVersion.plugin')
const reputationHistorySchema = require('./schemas/reputationHistory')
const itemSchema = require('./schemas/boardItem')

const reputationSchema = new mongoose.Schema(
    {
        club: { type: String, index: true },
        user: { type: String, index: true },
        history: [reputationHistorySchema],
        reputation: { type: Number, default: 0 },
        plusToday: { type: Number, default: 0 },
        minusToday: { type: Number, default: 0 },
        admin: Boolean,
        invitedBy: String,
        userSince: {
            type: Date,
            default: Date.now,
        },
        adminSince: {
            type: Date,
            default: Date.now,
        },
        // myContent: [itemSchema],
        banned: Boolean,
        bannedUntil: { type: Date },
        questions: [String],
        articles: [String],
        answers: [String],
        comments: [String],
    },
    { minimize: false }
)

reputationSchema.plugin(updateIfCurrentPlugin)

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
