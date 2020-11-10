const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')

const { postSchema } = require('./post')
const notificationSchema = require('./schemas/notification')
const perkSchema = require('./schemas/perk')
const friendSchema = require('./schemas/friend')
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
        image: { type: Number, default: 0 },
        settings: {},
        progresses: [String],
        perks: [perkSchema],
        transactions: [String],
        friends: [friendSchema],
        followPosts: [String],
        myPosts: [String],
        currentId: {
            type: Number,
            default: 0,
            required: true,
        },
        users: [String],
        status: {
            type: String,
            default: 'notactivated',
            enum: ['notactivated', 'activated'],
            required: true,
        },
        notifications: [notificationSchema],
        myNotifications: [notificationSchema],
        lastSeenNot: { type: Number, default: 0 },
        followAccounts: [String],
        followingAccounts: [String],
        followProgresses: [String],
        tokens: [String],
        recentProgresses: [String],
        rewards: [String],
        language: { type: String, default: 'en' },
        description: {},
        descriptionText: String,
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

module.exports.Account = mongoose.model('Account', accountSchema)
