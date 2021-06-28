const mongoose = require('mongoose')
const privatePaths = require('mongoose-private-paths')
const { tokenTypes } = require('../config/tokens')

const tokenSchema = mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            index: true,
        },
        user: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: [tokenTypes.REFRESH, tokenTypes.INVITE],
            required: true,
        },
        expires: {
            type: Date,
            required: true,
        },
        blacklisted: {
            type: Boolean,
            default: false,
        },
        club: String,
    },
    {
        timestamps: true,
    }
)

// add plugin that converts mongoose to json
tokenSchema.plugin(privatePaths)

/**
 * @typedef Token
 */
const Token = mongoose.model('Token', tokenSchema)

module.exports = Token