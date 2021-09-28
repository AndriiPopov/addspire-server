const jwt = require('jsonwebtoken')
const httpStatus = require('http-status')
const ApiError = require('../utils/ApiError')
const { Account, Token } = require('../models')
const { tokenService, authService } = require('../services')
const { tokenTypes } = require('../config/tokens')

const accountFields = 'logoutAllDate name image wallet'
const auth = () => async (req, res, next) => {
    const logout = async () => {
        if (req.get('refreshtoken')) {
            authService.logout(req.get('refreshtoken'))
        }

        return next(new ApiError(httpStatus.UNAUTHORIZED, 'logout'))
    }
    try {
        if (process.env.NODE_ENV === 'test') {
            const accountId = req.get('accountId')
            req.account = await Account.findOne({ facebookProfile: accountId })
                .select('logoutAllDate name image wallet')
                .lean()
                .exec()

            if (req.account) next()
            else return logout()
            return
        }
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

                            // if (process.env.NODE_ENV !== 'development') {
                            //     const { authToken, platform, type } =
                            //         await authService.refreshOauthToken({
                            //             accountId: req.account._id,
                            //         })
                            //     if (!authToken) {
                            //         return logout()
                            //     }

                            //     await authService.updateCredentials(
                            //         req.account,
                            //         accessToken,
                            //         platform,
                            //         type,
                            //         refreshToken
                            //     )
                            // }
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
