const httpStatus = require('http-status')
const axios = require('axios')
const catchAsync = require('../utils/catchAsync')
const {
    authService,
    tokenService,
    userCreationService,
} = require('../services')
const { Account, Credential } = require('../models')
const config = require('../config/config')

const logout = catchAsync(async (req, res) => {
    await authService.logout(req.body.refreshToken)
    res.send({ logout: true })
})

// Tokens are refreshed in auth middleware
const refreshTokens = catchAsync(async (req, res, next) => {
    res.status(httpStatus.OK).send()
})

const loginApp = catchAsync(async (req, res) => {
    const data = req.body
    const redirect_uri =
        data.type === 'web'
            ? 'http://addspire.com'
            : 'https://auth.expo.io/@addspire/Addspire'

    const done = async (
        _empty,
        account,
        accessToken,
        expires,
        refreshToken
    ) => {
        await Credential.deleteMany({ user: account._id })
        const credential = new Credential({
            code: data.code,
            user: account._id,
            accessToken,
            expires,
            refreshToken,
            platform: data.platform,
            redirectUrl: redirect_uri,
        })
        await credential.save()
        const tokens = await tokenService.generateAuthTokens(account)

        res.status(httpStatus.OK)
            .set({
                accesstoken: tokens.access.token,
                refreshtoken: tokens.refresh.token,
            })
            .send({ message: 'success' })
    }

    let link = ''
    let creteFunc = () => {}

    const getCredentials = () => {
        if (data.platform === 'facebook') return config.facebook
        switch (data.type) {
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

    switch (data.platform) {
        case 'facebook':
            {
                const codeResponse = await axios.get(
                    'https://graph.facebook.com/v10.0/oauth/access_token',
                    {
                        params: {
                            client_id: cred.id,
                            redirect_uri,
                            client_secret: cred.secret,
                            code: data.code,
                        },
                    }
                )
                console.log(codeResponse)
                const accessToken =
                    codeResponse && codeResponse.data.access_token
                const refreshToken =
                    codeResponse && codeResponse.data.refresh_token
                const expires = codeResponse && codeResponse.data.expires_in
                if (accessToken) {
                    link = `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${accessToken}`
                    creteFunc = (response) => {
                        const profileData = response.data
                        const picture =
                            profileData.picture &&
                            profileData.picture.data &&
                            profileData.picture.data.url
                        userCreationService.createUserFB(
                            {
                                ...profileData,
                                displayName: `${profileData.first_name} ${profileData.last_name}`,
                                picture,
                                photos: [{ value: picture }],
                            },
                            (empty, account) =>
                                done(
                                    empty,
                                    account,
                                    accessToken,
                                    expires,
                                    refreshToken
                                )
                        )
                    }
                } else {
                    return
                }
            }
            break

        case 'google':
            {
                const codeResponse = await axios.get(
                    'https://oauth2.googleapis.com/token',
                    {
                        params: {
                            client_id: '781480752562274',
                            redirect_uri,
                            client_secret: '02fc2f29e48cf4084e4f78f1d13047f0',
                            code: data.code,
                            grant_type: 'authorization_code',
                        },
                    }
                )
                console.log(codeResponse)
                const accessToken =
                    codeResponse && codeResponse.data.access_token
                const refreshToken =
                    codeResponse && codeResponse.data.refresh_token
                const expires = codeResponse && codeResponse.data.expires_in
                if (accessToken) {
                    link = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
                    creteFunc = (response) => {
                        const profileData = response.data
                        userCreationService.createUserGG(
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
                            (empty, account) =>
                                done(
                                    empty,
                                    account,
                                    accessToken,
                                    expires,
                                    refreshToken
                                )
                        )
                    }
                }
            }
            break

        case 'dev': {
            if (config.env === 'development') {
                const account = await Account.findOne({
                    facebookProfile: data.code,
                })
                const tokens = await tokenService.generateAuthTokens(account)

                res.set({
                    accesstoken: tokens.access.token,
                    refreshtoken: tokens.refresh.token,
                }).send({
                    success: true,
                })
                return
            }
            break
        }
        default:
            return
    }

    axios.get(link).then(creteFunc)
    // .catch((err) => {
    //     throw new ApiError(httpStatus.CONFLICT, 'Not created')
    // })
})

module.exports = {
    logout,
    refreshTokens,
    loginApp,
}
