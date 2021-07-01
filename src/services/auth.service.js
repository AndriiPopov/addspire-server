const httpStatus = require('http-status')
const tokenService = require('./token.service')
const userCreationService = require('./userCreation.service')
const Token = require('../models/token.model')
const ApiError = require('../utils/ApiError')
const { tokenTypes } = require('../config/tokens')

const logout = async (refreshToken) => {
    if (refreshToken) {
        await Token.deleteOne({
            token: refreshToken,
            type: tokenTypes.REFRESH,
        })
    }
}

const refreshAuth = async (refreshToken) => {
    try {
        const refreshTokenDoc = await tokenService.verifyToken(
            refreshToken,
            tokenTypes.REFRESH
        )
        const user = await userCreationService.getUserById(refreshTokenDoc.user)
        if (!user) {
            throw new Error()
        }
        await refreshTokenDoc.remove()
        return tokenService.generateAuthTokens(user)
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate')
    }
}

module.exports = {
    logout,
    refreshAuth,
}
