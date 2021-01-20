const express = require('express')

const router = express.Router()
var proxy = require('express-http-proxy')

router.use(
    '/',
    proxy('https://api.unsplash.com', {
        proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
            proxyReqOpts.headers = {
                Authorization:
                    'Client-ID xv7tFGyLSDUqXv4S30YpAXKDgpooD9OySdaKsqeJoWc',
            }
            return proxyReqOpts
        },
    })
)

module.exports = router
