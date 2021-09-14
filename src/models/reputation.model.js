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
        },
        address: {
            type: String,
            maxlength: mongoLength.name.max,
        },
        phone: {
            type: String,
            maxlength: mongoLength.name.max,
        },
        web: {
            type: String,
            maxlength: mongoLength.name.max,
        },
        email: {
            type: String,
            maxlength: mongoLength.name.max,
        },
        social: {
            type: String,
            maxlength: mongoLength.message.max,
        },
        profileBackground: { type: String, default: '' },
        profileDescription: {
            type: String,
            maxlength: mongoLength.description.max,
        },
        profileAddress: {
            type: String,
            maxlength: mongoLength.name.max,
        },
        profilePhone: {
            type: String,
            maxlength: mongoLength.name.max,
        },
        profileWeb: {
            type: String,
            maxlength: mongoLength.name.max,
        },
        profileEmail: {
            type: String,
            maxlength: mongoLength.name.max,
        },
        profileSocial: {
            type: String,
            maxlength: mongoLength.message.max,
        },
    },
    { minimize: false }
)

// General search
reputationSchema.index({
    tags: 1,
})

reputationSchema.index({
    name: 'text',
})

// Club search
reputationSchema.index({
    club: 1,
    tags: 1,
})

reputationSchema.index({
    club: 1,
    name: 'text',
})

// User search
reputationSchema.index({
    owner: 1,
    clubName: 'text',
})

reputationSchema.index({
    owner: 1,
    starred: 1,
})

// For sorting
reputationSchema.index({
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
