const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const types = mongoose.Schema.Types

const userSchema = new mongoose.Schema(
    {
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
        currentAccount: String,
        myAccount: String,
        teamAccounts: [String],
    },
    { minimize: false }
)

userSchema.methods.generateAuthToken = function() {
    try {
        const token = jwt.sign(
            { _id: this._id, issued: new Date().getTime() },
            process.env.jwtPrivateKey,
            {
                expiresIn: '7d',
            }
        )
        return token
    } catch (ex) {}
}

module.exports.User = mongoose.model('User', userSchema)
