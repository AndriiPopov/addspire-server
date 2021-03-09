const express = require('express')
const router = express.Router()
const passport = require('passport')
const { generateAuthToken } = require('../models/account')
require('../authStrategies/google')
require('../authStrategies/facebook')
require('../authStrategies/twitter')
require('../authStrategies/github')
require('../authStrategies/instagram')

// GOOGLE
router.get(
    '/google/start',
    function(req, res, next) {
        res.cookie('rememberme', req.query.rememberme)
        res.cookie('redirectto', req.query.redirect, {
            expires: new Date(new Date().getTime() + 60 * 1000),
        })
        next()
    },
    passport.authenticate('google', {
        session: false,
        scope: ['openid', 'profile', 'email'],
    })
)

router.get(
    '/google/redirect',
    passport.authenticate('google', { session: false }),
    async (req, res) => {
        if (req.user) {
            const token = generateAuthToken(req.user)
            res.cookie('auth_token', token, {
                expires: new Date(
                    new Date().getTime() + 6 * 24 * 60 * 60 * 1000
                ),
            }).redirect(
                process.env.NODE_ENV === 'production'
                    ? 'https://addspire.com'
                    : 'http://my.websiter.test:3000'
            )
        } else {
            resredirect(
                process.env.NODE_ENV === 'production'
                    ? 'https://addspire.com'
                    : 'http://my.websiter.test:3000'
            )
        }
    }
)

// Instagram
router.get(
    '/instagram/start',
    function(req, res, next) {
        res.cookie('rememberme', req.query.rememberme)
        res.cookie('redirectto', req.query.redirect, {
            expires: new Date(new Date().getTime() + 60 * 1000),
        })
        next()
    },
    passport.authenticate('instagram', {
        session: false,
        scope: ['openid', 'profile', 'email'],
    })
)

router.get(
    '/instagram/redirect',
    passport.authenticate('instagram', { session: false }),
    async (req, res) => {
        if (req.user) {
            const token = generateAuthToken(req.user)
            res.cookie('auth_token', token, {
                expires: new Date(
                    new Date().getTime() + 6 * 24 * 60 * 60 * 1000
                ),
            }).redirect(
                process.env.NODE_ENV === 'production'
                    ? 'https://addspire.com'
                    : 'http://my.websiter.test:3000'
            )
        } else {
            resredirect(
                process.env.NODE_ENV === 'production'
                    ? 'https://addspire.com'
                    : 'http://my.websiter.test:3000'
            )
        }
    }
)

// FACEBOOK
router.get(
    '/facebook/start',
    function(req, res, next) {
        res.cookie('rememberme', req.query.rememberme)
        res.cookie('redirectto', req.query.redirect, {
            expires: new Date(new Date().getTime() + 60 * 1000),
        })
        next()
    },
    passport.authenticate('facebook', {
        session: false,
    })
)

router.get(
    '/facebook/redirect',
    passport.authenticate('facebook', { session: false }),
    async (req, res) => {
        if (req.user) {
            const token = generateAuthToken(req.user)
            res.cookie('auth_token', token, {
                expires: new Date(
                    new Date().getTime() + 6 * 24 * 60 * 60 * 1000
                ),
            }).redirect(
                process.env.NODE_ENV === 'production'
                    ? 'https://addspire.com'
                    : 'http://my.websiter.test:3000'
            )
        } else {
            resredirect(
                process.env.NODE_ENV === 'production'
                    ? 'https://addspire.com'
                    : 'http://my.websiter.test:3000'
            )
        }
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
// if (req.user) {
//         const token = req.user.generateAuthToken()
//         res.cookie('auth_token', token, {
//             expires: new Date(new Date().getTime() + 300 * 24 * 60 * 60 * 1000),
//         }).redirect(
//             process.env.NODE_ENV === 'production'
//                 ? 'https://my.websiter.dev/login'
//                 : 'http://my.websiter.test:3000/login'
//         )
//     }
// else {
//             resredirect(
//                 process.env.NODE_ENV === 'production'
//                     ? 'https://addspire.com'
//                     : 'http://my.websiter.test:3000'
//             )
//         }
// }
// )

// GITHUB
router.get(
    '/github/start',
    function(req, res, next) {
        res.cookie('rememberme', req.query.rememberme)
        res.cookie('redirectto', req.query.redirect, {
            expires: new Date(new Date().getTime() + 60 * 1000),
        })
        next()
    },
    passport.authenticate('github', {
        session: false,
    })
)

router.get(
    '/github/redirect',
    passport.authenticate('github', { session: false }),
    async (req, res) => {
        if (req.user) {
            const token = generateAuthToken(req.user)
            res.cookie('auth_token', token, {
                expires: new Date(
                    new Date().getTime() + 6 * 24 * 60 * 60 * 1000
                ),
            }).redirect(
                process.env.NODE_ENV === 'production'
                    ? 'https://addspire.com'
                    : 'http://my.websiter.test:3000'
            )
        } else {
            resredirect(
                process.env.NODE_ENV === 'production'
                    ? 'https://addspire.com'
                    : 'http://my.websiter.test:3000'
            )
        }
    }
)

module.exports = router
