const passport = require('passport')
const passportGoogle = require('passport-google-oauth').OAuth2Strategy
const { User } = require('../models/user')
const { createUserGG } = require('../authStrategies/createUser')

const passportConfig = {
    clientID: process.env.GoogleClientID || '1',
    clientSecret: process.env.GoogleClientSecret || '1',
    callbackURL: 'https://addspire.com/api/appauth/google/redirect',
}

passport.use('googleapp', new passportGoogle(passportConfig, createUserGG))
