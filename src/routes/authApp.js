const express = require('express')
const router = express.Router()
const passport = require('passport')
require('../authStrategiesApp/google')
require('../authStrategiesApp/facebook')
require('../authStrategiesApp/twitter')
require('../authStrategiesApp/github')
const { generateAuthToken } = require('../models/account')

// GOOGLE
router.get(
    '/google/start',

    passport.authenticate('googleapp', {
        session: false,
        scope: ['openid', 'profile', 'email'],
    })
)

router.get(
    '/google/redirect',
    passport.authenticate('googleapp', { session: false }),
    async (req, res) => {
        const token = generateAuthToken(req.user)

        res.redirect(
            // process.env.NODE_ENV !== 'production'
            //     ? 'exp://192.168.0.105:19000?t=' + token
            //     : 'addspire://?t=' + token
            'exp://192.168.0.105:19000?t=' + token
        )
    }
)

// FACEBOOK
router.get(
    '/facebook/start',

    passport.authenticate('facebookapp', {
        session: false,
    })
)

router.get(
    '/facebook/redirect',
    passport.authenticate('facebookapp', { session: false }),
    async (req, res) => {
        const token = generateAuthToken(req.user)

        res.redirect(
            process.env.NODE_ENV !== 'production'
                ? 'exp://192.168.0.105:19000?t=' + token
                : 'addspire://?t=' + token
        )
    }
)

// // TWITTER
// router.get(
//     '/twitter/start',
//     function(req, res, next) {
//         res.cookie('rememberme', req.query.rememberme)
// res.cookie('redirectto', req.query.redirect, {
//     expires: new Date(new Date().getTime() + 5 * 1000),
// })
//         next()
//     },
//     passport.authenticate('twitter', {
//         session: false,
//     })
// )

// router.get(
//     '/twitter/redirect',
//     passport.authenticate('twitter', { session: false }),
//     async (req, res) => {
//         const token = req.user.generateAuthToken()
//         res.cookie('auth_token', token, {
//             expires: new Date(new Date().getTime() + 300 * 24 * 60 * 60 * 1000),
//         }).redirect(
//             process.env.NODE_ENV === 'production'
//                 ? 'https://my.websiter.dev/login'
//                 : 'http://my.websiter.test:3000/login'
//         )
//     }
// )

// GITHUB
router.get(
    '/github/start',

    passport.authenticate('githubapp', {
        session: false,
    })
)

router.get(
    '/github/redirect',
    passport.authenticate('githubapp', { session: false }),
    async (req, res) => {
        const token = generateAuthToken(req.user)
        res.redirect(
            process.env.NODE_ENV !== 'production'
                ? 'exp://192.168.0.105:19000?t=' + token
                : 'addspire://?t=' + token
        )
    }
)

module.exports = router
