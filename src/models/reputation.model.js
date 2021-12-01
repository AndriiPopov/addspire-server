const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const { mongoLength } = require('../config/fieldLength')
const basicModel = require('./basicModel/basicModel')
const basicTag = require('./basicModel/basicTag')
const { increaseVersion } = require('./plugins')

const reputationSchema = new mongoose.Schema(
    {
        ...basicModel,
        club: { type: String, required: true },
        clubName: { type: String, required: true },
        clubImage: { type: String },
        clubTags: [basicTag],
        reputationTags: [basicTag],
        profileTags: [basicTag],
        owner: { type: String, required: true },
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
        banned: { type: Boolean, default: false },
        bannedUntil: { type: Date },
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
        background: { type: String, default: '' },
        description: {
            type: String,
            maxlength: mongoLength.description.max,
            default: '',
        },
        address: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        phone: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        web: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        email: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        social: {
            type: String,
            maxlength: mongoLength.message.max,
            default: '',
        },
        profileBackground: { type: String, default: '' },
        profileDescription: {
            type: String,
            maxlength: mongoLength.description.max,
            default: '',
        },
        profileAddress: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        profilePhone: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        profileWeb: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        profileEmail: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        profileSocial: {
            type: String,
            maxlength: mongoLength.message.max,
            default: '',
        },
        location: {
            type: { type: String },
            coordinates: [Number],
        },
        clubAddress: { type: String, default: '' },
        global: { type: Boolean, default: false },
        answersCount: { type: Number, default: 0 },
        questionsCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        lastContent: {
            resourceId: String,
            resourceType: String,
        },
    },
    { minimize: false }
)

// General search
reputationSchema.index(
    { tags: 1, reputation: -1 },
    {
        partialFilterExpression: { global: true },
    }
)

reputationSchema.index({
    location: '2dsphere',
    tags: 1,
    reputation: -1,
})

reputationSchema.index({
    location: '2dsphere',
    reputation: -1,
})

reputationSchema.index(
    { reputation: -1 },
    { partialFilterExpression: { global: true } }
)

// Club search
reputationSchema.index({
    club: 1,
    reputation: -1,
})

// My clubs search
reputationSchema.index(
    {
        owner: 1,
        reputation: -1,
    },
    { partialFilterExpression: { starred: true } }
)

reputationSchema.index({
    owner: 1,
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
