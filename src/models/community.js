const mongoose = require('mongoose')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const basicModel = require('./basicModel/basicModel')

const types = mongoose.Types

const communitySchema = new mongoose.Schema(
    {
        ...basicModel,
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
        private: Boolean,
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
