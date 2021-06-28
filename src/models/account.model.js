const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const privatePaths = require('mongoose-private-paths')
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
            index: true,
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
        myNotifications: [notificationSchema],
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
        reputations: [
            {
                clubId: { type: String, required: true },
                reputationId: { type: String, required: true },
                admin: { type: Boolean, default: false },
            },
        ],
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
        views: Number,
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
        starredClubs: [String],
    },
    { minimize: false }
)

accountSchema.plugin(privatePaths, { prefix: '-' })
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
