const passport = require('passport')
const passportGithub = require('passport-github').Strategy
const { User } = require('../models/user')
const { createUserGH } = require('../authStrategies/createUser')

const passportConfig = {
    clientID: process.env.GithubClientID,
    clientSecret: process.env.GithubClientSecret,
    callbackURL:
        process.env.NODE_ENV === 'production'
            ? 'https://addspire.com/api/authApp/github/redirect'
            : 'http://192.168.0.105:5000/api/authApp/github/redirect',
    passReqToCallback: true,
}

passport.use('githubapp', new passportGithub(passportConfig, createUserGH))
