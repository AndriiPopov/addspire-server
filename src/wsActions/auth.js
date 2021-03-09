const { Account } = require('../models/account')
const jwt = require('jsonwebtoken')
const { sendError } = require('./confirm')
const { redisClient: client } = require('../startup/redis')

module.exports.auth = async (ws, data) => {
    try {
        let account
        const token = data.user

        if (token) {
            await jwt.verify(
                token,
                process.env.jwtPrivateKey,
                async (err, decoded) => {
                    if (err) {
                        sendError(ws, 'Login error1.', true)
                    } else {
                        if (
                            await Account.exists({
                                _id: decoded._id,
                            })
                        ) {
                            ws.account = decoded._id
                            ws.resources = data.resourcesToMonitor
                            ws.send(
                                JSON.stringify({
                                    messageCode: 'authSuccess',
                                })
                            )
                            client.set(ws.account, true, 'EX', 40)
                        } else sendError(ws, 'Login error.4', true)
                    }
                }
            )
        }
    } catch (ex) {
        sendError(ws, 'Login error.5', true)
    }
}
