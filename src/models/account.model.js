const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const notificationSchema = require('./schemas/notification')
const { increaseVersion } = require('./plugins')
const Profile = require('./schemas/profile.schema')

const accountSchema = new mongoose.Schema(
    {
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

        profiles: [Profile],
        defaultProfile: String,
        topClubVisits: [],
        lastClubVisits: [],
    },
    { minimize: false }
)

accountSchema.index({ expoTokens: 1 })
accountSchema.index({ appleProfile: 1 })
accountSchema.index({ facebookProfile: 1 })
accountSchema.index({ googleProfile: 1 })

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
