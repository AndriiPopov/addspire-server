const passport = require('passport')
const passportGoogle = require('passport-google-oauth').OAuth2Strategy
const { Account } = require('../models/account')
const { createUserGG } = require('./createUser')

const passportConfig = {
    clientID: process.env.GoogleClientID || '1',
    clientSecret: process.env.GoogleClientSecret || '1',
    callbackURL: 'https://addspire.com/api/auth/google/redirect',
}

passport.use(new passportGoogle(passportConfig, createUserGG))
