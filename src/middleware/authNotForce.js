const jwt = require('jsonwebtoken')
const { User } = require('../models/user')

module.exports = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token')
        if (!token) {
            next()
            return
        }
        await jwt.verify(
            token,
            process.env.jwtPrivateKey,
            async (err, decoded) => {
                if (err) return next()
                else {
                    req.user = await User.findById(decoded._id)
                    if (!req.user) return next()
                    else {
                        if (decoded.issued < req.user.logoutAllDate) {
                            req.user = null
                            return next()
                        }
                        return next()
                    }
                }
            }
        )
    } catch (ex) {
        return next()
    }
}
