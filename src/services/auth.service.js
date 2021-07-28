const httpStatus = require('http-status')
const { default: axios } = require('axios')
const tokenService = require('./token.service')
const userCreationService = require('./userCreation.service')
const Token = require('../models/token.model')
const ApiError = require('../utils/ApiError')
const { tokenTypes } = require('../config/tokens')
const config = require('../config/config')
const { Credential } = require('../models')

const logout = async (refreshToken) => {
    if (refreshToken) {
        await Token.deleteOne({
            token: refreshToken,
            type: tokenTypes.REFRESH,
        })
    }
}

const refreshOauthToken = async ({ token, platform, type, accountId }) => {
    try {
        if (accountId) {
            const credential = await Credential.find({ user: accountId })
                .lean()
                .exec()
            if (!credential) return
            token = credential.accessToken
            platform = credential.accessToken
            type = credential.loginType
        }
        const getCredentials = () => {
            if (platform === 'facebook') return config.facebook
            switch (type) {
                case 'web': {
                    return config.google.web
                }
                case 'android': {
                    return config.google.android
                }
                case 'ios': {
                    return config.google.ios
                }
                default:
                    return {}
            }
        }
        const cred = getCredentials()

        switch (platform) {
            case 'facebook': {
                const codeResponse = await axios.post(
                    'https://graph.facebook.com/oauth/access_token',
                    null,
                    {
                        params: {
                            client_id: cred.id,
                            client_secret: cred.secret,
                            fb_exchange_token: token,
                            grant_type: 'fb_exchange_token',
                        },
                    }
                )

                const authToken =
                    codeResponse &&
                    codeResponse.data &&
                    codeResponse.data.access_token
                return { authToken, platform, type }
            }

            case 'google': {
                const codeResponse = await axios.post(
                    'https://oauth2.googleapis.com/token',
                    null,
                    {
                        params: {
                            client_id: cred.id,
                            client_secret: cred.secret,
                            grant_type: 'authorization_code',
                        },
                    }
                )
                const authToken =
                    codeResponse &&
                    codeResponse.data &&
                    codeResponse.data.access_token
                return { authToken, platform, type }
            }
            default:
                return {}
        }
    } catch (error) {
        console.log(error)
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please again')
    }
}

const updateCredentials = async (
    account,
    accessToken,
    platform,
    type,
    refreshToken
) => {
    try {
        await Credential.deleteMany({ user: account._id })
        const credential = new Credential({
            user: account._id,
            accessToken,
            refreshToken,
            loginType: type,
            platform,
        })
        await credential.save()
    } catch (error) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please again')
    }
}

module.exports = {
    logout,
    refreshOauthToken,
    updateCredentials,
}
