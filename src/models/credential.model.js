const mongoose = require('mongoose')

const credentialSchema = mongoose.Schema(
    {
        user: {
            type: String,
            required: true,
        },
        accessToken: {
            type: String,
            required: true,
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
        date: {
            type: Date,
            default: Date.now,
        },
        loginType: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

credentialSchema.index({
    user: 1,
})

const Credential = mongoose.model('Credential', credentialSchema)

module.exports = Credential
