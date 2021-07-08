const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const { mongoLength } = require('../config/fieldLength')

const notificationSchema = require('./schemas/notification')
const { increaseVersion } = require('./plugins')
const basicTag = require('./basicModel/basicTag')

const accountSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            maxlength: mongoLength.name.max,
            minlength: mongoLength.name.min,
        },
        googleProfile: {
            type: String,
            trim: true,
            index: true,
            unique: true,
            sparse: true,
            private: true,
        },
        appleProfile: {
            type: String,
            trim: true,
            index: true,
            unique: true,
            sparse: true,
            private: true,
        },
        facebookProfile: {
            type: String,
            trim: true,
            index: true,
            unique: true,
            sparse: true,
            private: true,
        },
        image: { type: String, default: '' },
        settings: {},
        notifications: [notificationSchema],
        feed: [notificationSchema],
        lastSeenNot: { type: Number, default: 0 },
        tokens: { type: [String], private: true },
        language: { type: String, default: 'en' },
        userid: {
            type: String,
            required: true,
            private: true,
        },
        accountInfo: { type: {}, private: true },
        platformId: {
            type: String,
            required: true,
            private: true,
        },
        logoutAllDate: {
            type: Number,
            default: 0,
            private: true,
        },
        reputationsCount: {
            type: Number,
            default: 0,
        },
        seenNots: [String],
        accessToken: { type: String, private: true },
        refreshToken: { type: String, private: true },
        code: { type: String, private: true },
        following: [String],
        followingClubs: [String],
        followingQuestions: [String],
        tags: [basicTag],
        description: {
            type: String,
            maxlength: mongoLength.description.max,
            minlength: mongoLength.description.min,
        },
        contact: {
            type: String,
            maxlength: mongoLength.description.max,
            minlength: mongoLength.description.min,
        },
        reputations: {
            type: [
                {
                    reputation: String,
                    club: String,
                },
            ],
            default: [],
        },
        expoTokens: [String],
    },
    { minimize: false }
)

// General search
accountSchema.index({ tags: 1 })
accountSchema.index({ name: 'text' })
accountSchema.index({ reputationsCount: -1 })
accountSchema.index({ expoTokens: 1 })

accountSchema.plugin(mongoosePaginate)

accountSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports = mongoose.model('Account', accountSchema)
