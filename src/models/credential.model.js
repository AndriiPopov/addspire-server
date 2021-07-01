const mongoose = require('mongoose')

const credentialSchema = mongoose.Schema(
    {
        code: {
            type: String,
        },
        user: {
            type: String,
            required: true,
            index: true,
        },
        accessToken: {
            type: String,
        },
        expires: {
            type: Date,
        },
        refreshToken: {
            type: String,
        },
        blacklisted: {
            type: Boolean,
            default: false,
        },
        platform: {
            type: String,
            required: true,
        },
        redirectUrl: String,
        date: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
)

// add plugin that converts mongoose to json

const Credential = mongoose.model('Credential', credentialSchema)

module.exports = Credential
