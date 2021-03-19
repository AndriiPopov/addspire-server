const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')

const { postSchema } = require('./post')
const notificationSchema = require('./schemas/notification')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const suggestedChangeSchema = require('./schemas/suggestedChangeSchema')

const types = mongoose.Types

const communitySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            minlength: 2,
            required: true,
            maxlength: mongoLength.name,
            index: true,
        },
        images: [String],
        image: { type: String, default: '' },
        settings: {},
        admins: [String],
        sadmins: [String],
        collaborators: [String],
        posts: [String],
        notifications: [notificationSchema],
        users: [String],
        usersCount: {
            type: Number,
            default: 0,
        },
        boards: [String],
        boardsCount: {
            type: Number,
            default: 0,
        },
        advices: [String],
        advicesCount: {
            type: Number,
            default: 0,
        },
        people: [String],
        peopleCount: {
            type: Number,
            default: 0,
        },
        places: [String],
        placesCount: {
            type: Number,
            default: 0,
        },
        documents: [String],
        documentsCount: {
            type: Number,
            default: 0,
        },
        surveys: [String],
        surveysCount: {
            type: Number,
            default: 0,
        },
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
        description: {},
        shortDescription: String,
        structure: String,
        private: Boolean,
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
        url: String,
    },
    { minimize: false }
)
communitySchema.plugin(updateIfCurrentPlugin)

communitySchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Community = mongoose.model('Community', communitySchema)
