const jwt = require('jsonwebtoken')
const { Account } = require('../models/account')

const logout = res => {
    res.redirect(
        process.env.NODE_ENV === 'production'
            ? 'https://my.websiter.dev/logout'
            : 'http://my.websiter.test:3000/logout'
    )
}

module.exports = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token')
        if (!token)
            return res.status(412).send('Access denied. No token provided.')
        await jwt.verify(
            token,
            process.env.jwtPrivateKey,
            async (err, decoded) => {
                if (err) {
                    return logout(res)
                } else {
                    req.account = await Account.findById(decoded._id)
                        .select('logoutAllDate')
                        .lean()
                        .exec()
                    if (!req.account) {
                        return logout(res)
                    } else {
                        if (decoded.issued < req.account.logoutAllDate) {
                            req.account = null
                            return logout(res)
                        }
                        next()
                        return
                    }
                }
            }
        )
    } catch (ex) {
        return res.status(412).send('Error.')
    }
}
