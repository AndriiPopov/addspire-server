const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const basicModel = require('./basicModel/basicModel')
const { increaseVersion } = require('./plugins')
const { mongoLength } = require('../config/fieldLength')

const reputationSchema = new mongoose.Schema(
    {
        ...basicModel,
        club: { type: String, required: true },
        clubName: { type: String, required: true },
        owner: { type: String, required: true },
        reputation: { type: Number, default: 0 },
        plusToday: { type: Number, default: 0 },
        minusToday: { type: Number, default: 0 },
        admin: { type: Boolean, default: false },
        userSince: {
            type: Date,
            default: Date.now,
        },
        banned: { type: Boolean, default: false },
        gains: [
            {
                reputation: Number,
                gainType: String,
                questionId: String,
                questionName: String,
                comment: String,
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
        starred: { type: Boolean, default: false },
        member: { type: Boolean, default: false },

        location: {
            type: { type: String },
            coordinates: [Number],
        },
        global: { type: Boolean, default: false },
        answersCount: { type: Number, default: 0 },
        questionsCount: { type: Number, default: 0 },
        postsCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        profile: {
            type: String,
            required: true,
        },
        label: {
            type: String,
            required: true,
            maxlength: mongoLength.label.max,
            minlength: mongoLength.label.min,
        },
    },
    { minimize: false }
)

// General search
reputationSchema.index({ tags: 1, reputation: -1 })

reputationSchema.index({
    location: '2dsphere',
    tags: 1,
    reputation: -1,
})

reputationSchema.index({
    location: '2dsphere',
    reputation: -1,
})

reputationSchema.index({ reputation: -1 })

// Club search
reputationSchema.index({
    club: 1,
    reputation: -1,
})

// My clubs search
reputationSchema.index({
    owner: 1,
    reputation: -1,
})

reputationSchema.index({
    owner: 1,
    profile: -1,
    reputation: -1,
})

reputationSchema.plugin(mongoosePaginate)
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
