const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const { Account } = require('../models/account')

const passportConfig = {
    clientID: process.env.FBClientID || '1',
    clientSecret: process.env.FBClientSecret || '1',
    callbackURL: 'https://addspire.com/api/auth/facebook/redirect',
}

passport.use(
    new FacebookStrategy(
        passportConfig,
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log(profile)
                let account = await Account.findById('f_' + profile.id)
                    .select('_id')
                    .lean()
                    .exec()
                if (!account) {
                    let name = profile.displayName || profile.username
                    name = name && name.length > 1 && name
                    account = new Account({
                        _id: 'f_' + profile.id,
                        name: name || 'f_' + profile.id,
                        platformId: 'facebook',
                        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                        accountInfo: {
                            displayName: profile.displayName,
                            emails: profile.emails,
                            photos: [profile.picture],
                            userid: profile.id,
                        },
                    })
                    if (
                        profile.photos &&
                        profile.photos.length > 0 &&
                        profile.photos[0].value
                    )
                        account.image = profile.photos[0].value
                    account.markModified('accountInfo')
                    account = await account.save()
                }
                if (account) return done(null, account)
                else return done()
            } catch (ex) {
                console.log('Create user failed.')
                console.log(ex)
            }
        }
    )
)
