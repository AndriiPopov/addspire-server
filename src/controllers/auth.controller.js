const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { authService } = require('../services')

const logout = catchAsync(async (req, res) => {
    await authService.logout(req.body.refreshToken)
    res.send({ logout: true })
})

// Tokens are refreshed in auth middleware
const refreshTokens = catchAsync(async (req, res) => {
    res.status(httpStatus.OK).send()
})

const loginApp = catchAsync(async (req, res) => {
    const tokens = await authService.loginApp(req)
    res.status(httpStatus.OK)
        .set({
            accesstoken: tokens.access.token,
            refreshtoken: tokens.refresh.token,
        })
        .send({ message: 'success' })
})

const linkAccount = catchAsync(async (req, res) => {
    await authService.linkAccount(req)
    res.status(httpStatus.OK).send()
})

const unlinkAccount = catchAsync(async (req, res) => {
    await authService.unlinkAccount(req)
    res.status(httpStatus.OK).send()
})

module.exports = {
    logout,
    refreshTokens,
    loginApp,
    linkAccount,
    unlinkAccount,
}
