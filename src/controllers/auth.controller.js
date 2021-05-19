const httpStatus = require('http-status')
const jwt = require('jsonwebtoken')
const catchAsync = require('../utils/catchAsync')
const {
    authService,
    userService,
    tokenService,
    emailService,
} = require('../services')
const { tokenTypes } = require('../config/tokens')
const { Account, Token, Credential } = require('../models')
const axios = require('axios')

const register = catchAsync(async (req, res) => {
    const user = await userService.createUserEM(req.body)
    const tokens = await tokenService.generateAuthTokens(user)
    res.status(httpStatus.CREATED)
        .set({
            access_token: tokens.access.token,
            refresh_token: tokens.refresh.token,
        })
        .send()
})

const login = catchAsync(async (req, res) => {
    const { email, password } = req.body
    const user = await authService.loginUserWithEmailAndPassword(
        email,
        password
    )
    const tokens = await tokenService.generateAuthTokens(user)
    res.status(httpStatus.CREATED)
        .set({
            access_token: tokens.access.token,
            refresh_token: tokens.refresh.token,
        })
        .send()
})

const logout = catchAsync(async (req, res) => {
    await authService.logout(req.body.refreshToken)
    res.send({ logout: true })
})

const refreshTokens = catchAsync(async (req, res, next) => {
    res.send()
})

const forgotPassword = catchAsync(async (req, res) => {
    const resetPasswordToken = await tokenService.generateResetPasswordToken(
        req.body.email
    )
    await emailService.sendResetPasswordEmail(
        req.body.email,
        resetPasswordToken
    )
    res.status(httpStatus.NO_CONTENT).send()
})

const resetPassword = catchAsync(async (req, res) => {
    await authService.resetPassword(req.query.token, req.body.password)
    res.status(httpStatus.NO_CONTENT).send()
})

const sendVerificationEmail = catchAsync(async (req, res) => {
    const verifyEmailToken = await tokenService.generateVerifyEmailToken(
        req.user
    )
    await emailService.sendVerificationEmail(req.user.email, verifyEmailToken)
    res.status(httpStatus.NO_CONTENT).send()
})

const verifyEmail = catchAsync(async (req, res) => {
    await authService.verifyEmail(req.query.token)
    res.status(httpStatus.NO_CONTENT).send()
})

const loginApp = catchAsync(async (req, res) => {
    const data = req.body
    const redirect_uri = data.web
        ? 'http://localhost:3000/'
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

        res.set({
            accesstoken: tokens.access.token,
            refreshtoken: tokens.refresh.token,
        }).send({
            success: true,
        })
    }

    let link = ''
    let creteFunc = () => {}
    switch (data.platform) {
        case 'facebook':
            {
                const codeResponse = await axios.get(
                    'https://graph.facebook.com/v10.0/oauth/access_token',
                    {
                        params: {
                            client_id: '781480752562274',
                            redirect_uri,
                            client_secret: '02fc2f29e48cf4084e4f78f1d13047f0',
                            code: data.code,
                        },
                    }
                )
                const accessToken = codeResponse?.data.access_token
                const refreshToken = codeResponse?.data.refresh_token
                const expires = codeResponse?.data.expires_in
                if (accessToken) {
                    link = `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${accessToken}`
                    creteFunc = (response) => {
                        const profileData = response.data
                        const picture = profileData.picture?.data?.url
                        userService.createUserFB(
                            {
                                ...profileData,
                                displayName:
                                    profileData.first_name +
                                    ' ' +
                                    profileData.last_name,
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
                const accessToken = codeResponse?.data.access_token
                const refreshToken = codeResponse?.data.refresh_token
                const expires = codeResponse?.data.expires_in
                if (accessToken) {
                    link = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${data.accessToken}`
                    creteFunc = (response) => {
                        const profileData = response.data
                        userService.createUserGG(
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
    }

    axios
        .get(link)
        .then(creteFunc)
        .catch((err) => {
            resSendError(res, 'bad data')
            return
        })
})

module.exports = {
    register,
    login,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    sendVerificationEmail,
    verifyEmail,
    loginApp,
}
