const passport = require('passport')
const passportGoogle = require('passport-google-oauth').OAuth2Strategy
const { Account } = require('../models/account')

const passportConfig = {
    clientID: process.env.GoogleClientID || '1',
    clientSecret: process.env.GoogleClientSecret || '1',
    callbackURL: 'https://addspire.com/api/auth/google/redirect',
}

passport.use(
    new passportGoogle(
        passportConfig,
        async (accessToken, refreshToken, profile, done) => {
            try {
                let account = await Account.findById('g_' + profile.id)
                    .select('_id')
                    .lean()
                    .exec()
                if (!account) {
                    let name = profile.displayName || profile.username
                    name = name && name.length > 1 && name
                    account = new Account({
                        _id: 'g_' + profile.id,
                        name: name || 'g_' + profile.id,
                        platformId: 'google',
                        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                        accountInfo: {
                            displayName: profile.displayName,
                            emails: profile.emails,
                            photos: profile.photos,
                            userid: profile.id,
                        },
                    })
                    if (profile.photos.length > 0 && profile.photos[0].value)
                        account.image = profile.photos[0].value
                    account.markModified('accountInfo')
                    account = await account.save()
                }
                if (account) return done(null, account)
                else return done()
            } catch {
                console.log('Create user failed.')
            }
        }
    )
)
