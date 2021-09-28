const httpStatus = require('http-status')
const { default: axios } = require('axios')
const appleSignin = require('apple-signin-auth')
const tokenService = require('./token.service')
const userCreationService = require('./userCreation.service')
const Token = require('../models/token.model')
const ApiError = require('../utils/ApiError')
const { tokenTypes } = require('../config/tokens')
const config = require('../config/config')
const { Credential, Account } = require('../models')
const { get, client } = require('./redis.service')

const getAppleClientId = (type) =>
    type === 'web' ? 'com.addspire.web' : 'com.addspire'

const getAppleSecret = async (type) => {
    // let clientSecret = await get('appleClientSecret')
    // if (!clientSecret) {
    const clientSecret = appleSignin.getClientSecret({
        clientID: getAppleClientId(type),
        privateKeyPath: '../AuthKey_7XMDXL8TD3.p8',
        keyIdentifier: '7XMDXL8TD3',
        teamId: 'L8MPTS7SFS',
        expAfter: 10000000,
    })
    client.set('appleClientSecret', clientSecret, 'EX', 86400)
    // }

    return clientSecret
}

const logout = async (refreshToken) => {
    if (refreshToken) {
        await Token.deleteOne({
            token: refreshToken,
            type: tokenTypes.REFRESH,
        })
    }
}

const refreshOauthToken = async (data) => {
    try {
        let { token, platform, type } = data
        const { accountId } = data

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
            if (platform === 'google')
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
            if (platform === 'apple') return {}
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
            case 'apple': {
                const options = {
                    clientID: getAppleClientId(type), // identifier of Apple Service ID.
                    clientSecret: await getAppleSecret(type),
                }

                const codeResponse = appleSignin.refreshAuthorizationToken(
                    token,
                    options
                )

                const authToken = codeResponse && token

                return { authToken, platform, type }
            }
            default:
                return {}
        }
    } catch (error) {
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

const loginApp = async (req, res) => {
    try {
        const data = req.body

        const { platform, token, type, user } = data
        const done = async (
            _empty,
            account,
            accessToken,
            expires,
            refreshToken
        ) => {
            await updateCredentials(
                account,
                accessToken,
                platform,
                type,
                refreshToken
            )

            const tokens = tokenService.generateAuthTokens(account)
            if (!tokens) {
                throw new ApiError(httpStatus.CONFLICT, 'Not created')
            } else return tokens
        }

        switch (platform) {
            case 'facebook':
                {
                    const { authToken } = await refreshOauthToken({
                        token,
                        platform,
                        type,
                    })

                    if (authToken) {
                        const response = await axios.get(
                            `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${authToken}`
                        )

                        if (!response || !response.data) {
                            throw new ApiError(
                                httpStatus.CONFLICT,
                                'Not created'
                            )
                        }

                        const profileData = response.data
                        const picture =
                            profileData.picture &&
                            profileData.picture.data &&
                            profileData.picture.data.url
                        return userCreationService.createUserFB(
                            {
                                ...profileData,
                                displayName: `${profileData.first_name} ${profileData.last_name}`,
                                picture,
                                photos: [{ value: picture }],
                            },
                            (empty, account) => done(empty, account, authToken)
                        )
                    }
                }
                break

            case 'google': {
                const { authToken } = await refreshOauthToken({
                    token,
                    platform,
                    type,
                })

                if (authToken) {
                    const response = await axios.get(
                        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${authToken}`
                    )
                    const profileData = response.data
                    return userCreationService.createUserGG(
                        {
                            ...profileData,
                            id: profileData.sub,
                            displayName: profileData.name,
                            emails: profileData.email,
                            photos: [
                                {
                                    value: profileData.picture,
                                },
                            ],
                        },
                        (empty, account) => done(empty, account, authToken)
                    )
                }
                break
            }

            case 'apple': {
                const clientSecret = await getAppleSecret(type)
                if (!clientSecret)
                    throw new ApiError(httpStatus.CONFLICT, 'Not created')

                const options = {
                    clientID: getAppleClientId(type),
                    redirectUri: 'https://addspire.com/auth/callback',
                    clientSecret,
                }
                const response = await appleSignin.getAuthorizationToken(
                    token,
                    options
                )

                if (!response || !response.id_token)
                    throw new ApiError(httpStatus.CONFLICT, 'Not created')

                const { sub: userId } = await appleSignin.verifyIdToken(
                    response.id_token,
                    { audience: getAppleClientId(type) }
                )

                if (!userId)
                    throw new ApiError(httpStatus.CONFLICT, 'Not created')

                const { authToken } = await refreshOauthToken({
                    token: response.refresh_token,
                    platform,
                    type,
                })

                if (authToken) {
                    return userCreationService.createUserApple(
                        {
                            id: userId,
                            displayName: user
                                ? `${user.firstName} ${user.lastName}`
                                : '',
                            emails: user.email,
                        },
                        (empty, account) => done(empty, account, authToken)
                    )
                }
                throw new ApiError(httpStatus.CONFLICT, 'Not created')
            }
            case 'dev': {
                if (config.env === 'development') {
                    const account = await Account.findOne({
                        [type === 'apple' ? 'appleProfile' : 'facebookProfile']:
                            token,
                    })
                    return tokenService.generateAuthTokens(account)
                }
                break
            }
            default:
                return
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Please try again')
        } else throw error
    }
}

const linkAccount = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { platform, token, type } = body

        switch (platform) {
            case 'facebook': {
                const { authToken } = await refreshOauthToken({
                    token,
                    platform,
                    type,
                })

                if (authToken) {
                    const response = await axios.get(
                        `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${authToken}`
                    )

                    const profileData = response.data
                    await Account.updateOne(
                        { _id: accountId },
                        {
                            $set: {
                                [type === 'apple'
                                    ? 'appleProfile'
                                    : 'facebookProfile']:
                                    profileData.id.toString(),
                            },
                        },
                        { useFindAndModify: false }
                    )
                    return
                }
                throw new ApiError(httpStatus.CONFLICT, 'Not created')
            }

            case 'apple': {
                {
                    const clientSecret = await getAppleSecret(type)
                    if (!clientSecret)
                        throw new ApiError(httpStatus.CONFLICT, 'Not created')

                    const options = {
                        clientID: getAppleClientId(type),
                        redirectUri: 'https://addspire.com/auth/callback',
                        clientSecret,
                    }
                    const response = await appleSignin.getAuthorizationToken(
                        token,
                        options
                    )

                    if (!response || !response.id_token)
                        throw new ApiError(httpStatus.CONFLICT, 'Not created')

                    const { sub: userId } = await appleSignin.verifyIdToken(
                        response.id_token,
                        { audience: getAppleClientId(type) }
                    )

                    if (!userId)
                        throw new ApiError(httpStatus.CONFLICT, 'Not created')

                    await Account.updateOne(
                        { _id: accountId },
                        {
                            $set: {
                                appleProfile: userId.toString(),
                            },
                        },
                        { useFindAndModify: false }
                    )
                }
                break
            }
            case 'dev': {
                if (config.env === 'development') {
                    await Account.updateOne(
                        { _id: accountId },
                        {
                            $set: {
                                [type === 'apple'
                                    ? 'appleProfile'
                                    : 'facebookProfile']: token.toString(),
                            },
                        },
                        { useFindAndModify: false }
                    )
                }
                break
            }
            default:
                return
        }
    } catch (error) {
        console.log(error)
        if (!error.isOperational) {
            if (error && error.code === 11000)
                throw new ApiError(httpStatus.CONFLICT, 'Account exists')
            else throw new ApiError(httpStatus.CONFLICT, 'Please try again')
        } else throw error
    }
}

const unlinkAccount = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { platform } = body

        const result = await Account.updateOne(
            {
                _id: accountId,
                [platform === 'facebook' ? 'appleProfile' : 'facebookProfile']:
                    { $exists: true },
            },
            {
                $unset: {
                    [platform === 'facebook'
                        ? 'facebookProfile'
                        : 'appleProfile']: '',
                },
            },
            { useFindAndModify: false }
        )
        if (!result.nModified)
            throw new ApiError(httpStatus.CONFLICT, 'Not unlink last')
    } catch (error) {
        console.log(error)
        if (!error.isOperational)
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        else throw error
    }
}

module.exports = {
    logout,
    refreshOauthToken,
    updateCredentials,
    getAppleSecret,
    loginApp,
    linkAccount,
    unlinkAccount,
}
