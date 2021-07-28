const httpStatus = require('http-status')
const axios = require('axios')
const catchAsync = require('../utils/catchAsync')
const {
    authService,
    tokenService,
    userCreationService,
} = require('../services')
const { Account } = require('../models')
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
    try {
        const data = req.body

        const { platform, token, type } = data
        const done = async (
            _empty,
            account,
            accessToken,
            expires,
            refreshToken
        ) => {
            await authService.updateCredentials(
                account,
                accessToken,
                platform,
                type,
                refreshToken
            )

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

        switch (platform) {
            case 'facebook':
                {
                    const { authToken } = await authService.refreshOauthToken({
                        token,
                        platform,
                        type,
                    })

                    if (authToken) {
                        link = `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${authToken}`
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
                                    done(empty, account, authToken)
                            )
                        }
                    } else {
                        return
                    }
                }
                break

            case 'google':
                {
                    const { authToken } = await authService.refreshOauthToken({
                        token,
                        platform,
                        type,
                    })

                    if (authToken) {
                        link = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${authToken}`
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
                                    done(empty, account, authToken)
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
                    const tokens = await tokenService.generateAuthTokens(
                        account
                    )

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
        //     console.log(err)
        //     throw new ApiError(httpStatus.CONFLICT, 'Not created')
        // })
    } catch (err) {
        console.log(err)
    }
})

module.exports = {
    logout,
    refreshTokens,
    loginApp,
}
