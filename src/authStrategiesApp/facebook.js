const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const { createUserFB } = require('../authStrategies/createUser')

const passportConfig = {
    clientID: process.env.FBClientID || '1',
    clientSecret: process.env.FBClientSecret || '1',
    callbackURL: 'https://addspire.com/api/authApp/facebook/redirect',
}

passport.use('facebookapp', new FacebookStrategy(passportConfig, createUserFB))
