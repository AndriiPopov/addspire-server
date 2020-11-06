const { User } = require('../models/user')
const jwt = require('jsonwebtoken')
const { sendError } = require('./confirm')

const authenticate = async (data, ws) => {
    try {
        let user
        const token = data.user

        if (token) {
            await jwt.verify(
                token,
                process.env.jwtPrivateKey,
                async (err, decoded) => {
                    if (err) {
                        sendError(ws, 'Login error1.', true)
                    } else {
                        user = (await User.exists({ _id: decoded._id }))
                            ? decoded._id
                            : null
                        if (!user) {
                            sendError(ws, 'Login error2.', true)
                        }
                    }
                }
            )
        }

        return user
    } catch {
        sendError(ws, 'Login error.3', true)
        return false
    }
}

module.exports.auth = async (ws, data) => {
    try {
        let user = await authenticate(data, ws)
        if (user) {
            ws.user = user
            ws.resources = data.resourcesToMonitor
            ws.send(
                JSON.stringify({
                    messageCode: 'authSuccess',
                })
            )
        } else {
            sendError(ws, 'Login error.4', true)
        }
    } catch (ex) {
        sendError(ws, 'Login error.5', true)
    }
}
