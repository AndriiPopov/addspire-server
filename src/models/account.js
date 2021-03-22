const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')

const { postSchema } = require('./post')
const notificationSchema = require('./schemas/notification')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')

const types = mongoose.Types

const accountSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            minlength: 2,
            required: true,
            maxlength: mongoLength.name,
            index: true,
        },
        _id: {
            type: String,
            minlength: 2,
            required: true,
            maxlength: mongoLength.name,
        },
        images: [String],
        image: { type: String, default: '' },
        settings: {},
        admin: [String],
        sadmin: [String],
        collaborator: [String],
        progresses: [String],
        followPosts: [String],
        currentId: {
            type: Number,
            default: 0,
            required: true,
        },
        notifications: [notificationSchema],
        myNotifications: [notificationSchema],
        lastSeenNot: { type: Number, default: 0 },
        following: [{ itemType: String, item: String }],
        boards: [String],
        boardsCount: {
            type: Number,
            default: 0,
        },
        followers: [String],
        tokens: [String],
        language: { type: String, default: 'en' },
        description: {},
        descriptionText: String,
        structure: String,
        userid: {
            type: String,
            required: true,
        },
        accountInfo: {},
        platformId: {
            type: String,
            required: true,
        },
        logoutAllDate: {
            type: Number,
            default: 0,
        },
        followersCount: {
            type: Number,
            default: 0,
        },
        progressesCount: {
            type: Number,
            default: 0,
        },
        communities: [String],
        communitiesCount: {
            type: Number,
            default: 0,
        },
        shortDescription: String,
        seenNots: [String],
        saved: [String],
        savedCount: {
            type: Number,
            default: 0,
        },
        accessToken: String,
        refreshToken: String,
    },
    { minimize: false }
)
accountSchema.plugin(updateIfCurrentPlugin)

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

module.exports.generateAuthToken = function(account) {
    try {
        const token = jwt.sign(
            { _id: account._id, issued: new Date().getTime() },
            process.env.jwtPrivateKey,
            {
                expiresIn: '7d',
            }
        )
        return token
    } catch (ex) {}
}

module.exports.Account = mongoose.model('Account', accountSchema)
