const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')

const { postSchema } = require('./post')
const notificationSchema = require('./schemas/notification')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const suggestedChangeSchema = require('./schemas/suggestedChangeSchema')

const types = mongoose.Types

const peopleSchema = new mongoose.Schema(
    {
        user: String,
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
        notifications: [notificationSchema],
        owner: String,
        posts: [String],
        sadmins: [String],
        admins: [String],
        collaborators: [String],
        structure: String,
        parent: String,
        description: {},
        shortDescription: String,
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
        version: { type: Number, default: 0 },
        suggestedChangesCount: { type: Number, default: 0 },
        saved: [String],
        savedCount: {
            type: Number,
            default: 0,
        },
        community: String,
    },
    { minimize: false }
)
peopleSchema.plugin(updateIfCurrentPlugin)

peopleSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.People = mongoose.model('People', peopleSchema)
