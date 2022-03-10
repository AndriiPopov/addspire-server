const jwt = require('jsonwebtoken')
const dayjs = require('dayjs')
const config = require('../config/config')
const { Token } = require('../models')
const { tokenTypes } = require('../config/tokens')

const generateToken = (
    userId,
    expires,
    type,
    secret = process.env.jwtPrivateKey,
    club
) => {
    const payload = {
        sub: userId,
        iat: dayjs().valueOf(),
        exp: expires.unix(),
        type,
        club,
    }
    return jwt.sign(payload, secret)
}

const saveToken = async (
    token,
    userId,
    expires,
    type,
    blacklisted = false,
    club
) => {
    const tokenDoc = await Token.create({
        token,
        user: userId,
        expires: expires.toDate(),
        type,
        blacklisted,
        club,
    })

    return tokenDoc
}

const verifyToken = async (token, type) => {
    const payload = jwt.verify(token, process.env.jwtPrivateKey)
    const tokenDoc = await Token.findOne({
        token,
        type,
        user: payload.sub,
    })
        .select('')
        .lean()
        .exec()

    return tokenDoc
}

const generateAuthTokens = async (user) => {
    const accessTokenExpires = dayjs().add(
        config.jwt.accessExpirationDays,
        'days'
    )
    const accessToken = generateToken(
        user._id,
        accessTokenExpires,
        tokenTypes.ACCESS
    )

    const refreshTokenExpires = dayjs().add(
        config.jwt.refreshExpirationDays,
        'days'
    )
    const refreshToken = generateToken(
        user._id,
        refreshTokenExpires,
        tokenTypes.REFRESH
    )
    await saveToken(
        refreshToken,
        user._id,
        refreshTokenExpires,
        tokenTypes.REFRESH
    )

    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
        },
    }
}

module.exports = {
    generateToken,
    saveToken,
    verifyToken,
    generateAuthTokens,
}
