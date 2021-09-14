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
        },
        appleProfile: {
            type: String,
            trim: true,
            index: true,
            unique: true,
            sparse: true,
        },
        facebookProfile: {
            type: String,
            trim: true,
            index: true,
            unique: true,
            sparse: true,
        },
        image: { type: String, default: '' },
        background: { type: String, default: '' },
        notifications: [notificationSchema],
        feed: [notificationSchema],
        lastSeenNot: { type: Number, default: 0 },
        tokens: [String],
        language: { type: String, default: 'en' },
        userid: {
            type: String,
            required: true,
        },
        accountInfo: { type: {}, private: true },
        platformId: {
            type: String,
            required: true,
        },
        logoutAllDate: {
            type: Number,
            default: 0,
        },
        reputationsCount: {
            type: Number,
            default: 0,
        },
        accessToken: String,
        refreshToken: String,
        following: [String],
        followingClubs: [String],
        followingQuestions: [String],
        tags: [basicTag],
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
        reputations: {
            type: [
                {
                    reputation: { type: String, required: true },
                    club: { type: String, required: true },
                },
            ],
            default: [],
        },
        expoTokens: [String],
        wallet: { type: Number, default: 0 },
        gains: [
            {
                coins: { type: Number, required: true },
                questionId: { type: String, required: true },
                questionName: { type: String, required: true },
                actionType: { type: String, required: true },
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        walletHistory: [
            {
                coins: { type: Number, required: true },
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        totalEarned: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
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
