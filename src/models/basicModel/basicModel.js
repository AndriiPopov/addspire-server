const { mongoLength } = require('../../constants/fieldLength')
const mongoose = require('mongoose')
const notificationSchema = require('../schemas/notification')
const suggestedChangeSchema = require('../schemas/suggestedChangeSchema')
const types = mongoose.Schema.Types

module.exports = {
    settings: {},
    trend: { type: Number, default: 0 },
    name: {
        type: String,
        required: true,
        default: 'New goal',
        maxlength: mongoLength.name,
    },
    image: String,
    images: [String],
    likes: [String],
    likesCount: {
        type: Number,
        default: 0,
    },
    followers: [String],
    followersCount: {
        type: Number,
        default: 0,
    },
    category: [String],
    notifications: [notificationSchema],
    owner: String,
    posts: [String],
    sadmins: [String],
    admins: [String],
    collaborators: [String],
    structure: String,
    description: {},
    suggestedChanges: [suggestedChangeSchema],
    appliedChanges: [suggestedChangeSchema],
    date: {
        type: Date,
        default: Date.now,
    },
    updated: {
        type: Date,
        default: Date.now,
    },
    suggestedChangesCount: { type: Number, default: 0 },
    saved: [String],
    savedCount: {
        type: Number,
        default: 0,
    },
    community: String,
    confirmed: [
        {
            date: {
                type: Date,
                default: Date.now,
            },
            user: String,
            value: Boolean,
        },
    ],
    moderated: Boolean,
}
