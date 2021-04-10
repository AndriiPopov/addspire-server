const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const { createUserFB } = require('./createUser')

const passportConfig = {
    clientID: process.env.FBClientID || '1',
    clientSecret: process.env.FBClientSecret || '1',
    callbackURL: 'https://addspire.com/api/auth/facebook/redirect',
    profileFields: [
        'id',
        'displayName',
        'name',
        'picture.type(large)',
        'email',
    ],
}

passport.use(new FacebookStrategy(passportConfig, createUserFB))
