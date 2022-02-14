const jwt = require('jsonwebtoken')
const httpStatus = require('http-status')
const ApiError = require('../utils/ApiError')
const { Account, Token } = require('../models')
const { tokenService, authService } = require('../services')
const { tokenTypes } = require('../config/tokens')

const accountFields = 'logoutAllDate name image'
const auth = () => async (req, res, next) => {
    // If something is wrong or suspicious with the auth process, logout
    const logout = async () => {
        try {
            if (req.get('refreshtoken')) {
                await authService.logout(req.get('refreshtoken'))
            }
            next(new ApiError(httpStatus.UNAUTHORIZED, 'logout'))
        } catch (error) {
            next(new ApiError(httpStatus.UNAUTHORIZED, 'logout'))
        }
    }
    try {
        // In test environment separate auth process
        if (process.env.NODE_ENV === 'test') {
            const accountId = req.get('accountId')
            req.account = await Account.findOne({ facebookProfile: accountId })
                .select('logoutAllDate')
                .lean()
                .exec()

            if (req.account) next()
            else return logout()
            return
        }
        // Normal auth process
        // Check access token
        const accessToken = req.get('accesstoken')
        if (!accessToken) {
            return logout()
        }
        await jwt.verify(
            accessToken,
            process.env.jwtPrivateKey,
            async (err, decoded) => {
                if (err) {
                    if (err.name !== 'TokenExpiredError') {
                        return logout()
                    }

                    // Check access token if access token is expired
                    const refreshToken = req.get('refreshtoken')
                    if (!refreshToken) {
                        return logout()
                    }

                    await jwt.verify(
                        refreshToken,
                        process.env.jwtPrivateKey,
                        async (errRT, decodedRT) => {
                            if (errRT) {
                                return logout()
                            }
                            // Check if the user has logged out on all devices.
                            req.account = await Account.findById(decodedRT.sub)
                                .select(accountFields)
                                .lean()
                                .exec()
                            if (!req.account) {
                                return logout()
                            }
                            if (
                                decodedRT.iat * 1000 <
                                req.account.logoutAllDate
                            ) {
                                req.account = null
                                return logout()
                            }
                            const doc = await tokenService.verifyToken(
                                refreshToken,
                                tokenTypes.REFRESH
                            )

                            if (!doc) {
                                return logout()
                            }

                            await Token.deleteOne({ token: refreshToken })

                            // Get new tokens
                            const tokens =
                                await tokenService.generateAuthTokens(
                                    req.account
                                )
                            res.set({
                                accesstoken: tokens.access.token,
                                refreshtoken: tokens.refresh.token,
                            })
                            next()
                        }
                    )
                } else {
                    // Check if the user has logged out on all devices.
                    req.account = await Account.findById(decoded.sub)
                        .select(accountFields)
                        .lean()
                        .exec()

                    if (!req.account || !req.account._id) {
                        return logout()
                    }
                    if (decoded.iat * 1000 < req.account.logoutAllDate) {
                        req.account = null
                        return logout()
                    }
                    next()
                }
            }
        )
    } catch (ex) {
        logout()
    }
}

module.exports = auth
