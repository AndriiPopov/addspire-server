const mongoose = require('mongoose')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const { mongoLength } = require('../config/fieldLength')

const notificationSchema = require('./schemas/notification')
const increaseVersion = require('./plugins/increaseVersion.plugin')
const boardItemSchema = require('./schemas/boardItem')
const { toJSON, paginate } = require('./plugins')

const accountSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            minlength: 2,
            required: true,
            maxlength: mongoLength.name,
            index: true,
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
        settings: {},
        myNotifications: [notificationSchema],
        notifications: [notificationSchema],
        lastSeenNot: { type: Number, default: 0 },
        tokens: [String],
        language: { type: String, default: 'en' },
        description: String,
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
        reputations: [String],
        reputationsCount: {
            type: Number,
            default: 0,
        },
        seenNots: [String],
        accessToken: String,
        refreshToken: String,
        code: String,
        bookmarks: [boardItemSchema],
        history: [boardItemSchema],
        followers: [String],
        following: [String],
        followingClubs: [String],
        followingResources: [String],
        bookmarked: Number,
        views: Number,
        admin: [String],
    },
    { minimize: false }
)

// add plugin that converts mongoose to json
accountSchema.plugin(toJSON)
accountSchema.plugin(paginate)
accountSchema.plugin(updateIfCurrentPlugin)

/**
//  * Check if email is taken
//  * @param {string} email - The user's email
//  * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
//  * @returns {Promise<boolean>}
//  */
// accountSchema.statics.isEmailTaken = async function (email, excludeUserId) {
//     const user = await this.findOne({ email, _id: { $ne: excludeUserId } })
//     return !!user
// }

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
accountSchema.methods.isPasswordMatch = async function (password) {
    const user = this
    return bcrypt.compare(password, user.password)
}

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
