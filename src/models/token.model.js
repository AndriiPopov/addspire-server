const mongoose = require('mongoose')
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
            enum: [tokenTypes.REFRESH],
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

/**
 * @typedef Token
 */
const Token = mongoose.model('Token', tokenSchema)

module.exports = Token
