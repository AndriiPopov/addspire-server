const passport = require('passport')
const passportGithub = require('passport-github').Strategy
const { createUserGH } = require('./createUser')

const passportConfig = {
    clientID: process.env.GithubClientID,
    clientSecret: process.env.GithubClientSecret,
    callbackURL:
        process.env.NODE_ENV === 'production'
            ? 'https://addspire.com/api/auth/github/redirect'
            : 'http://my.websiter.test:5000/api/auth/github/redirect',
    passReqToCallback: true,
}

passport.use(new passportGithub(passportConfig, createUserGH))
