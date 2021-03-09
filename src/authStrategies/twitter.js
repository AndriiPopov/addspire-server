const passport = require('passport')
const TwitterStrategy = require('passport-twitter').Strategy
const { Account } = require('../models/account')

const passportConfig = {
    consumerKey: process.env.TwitterClientID || '1',
    consumerSecret: process.env.TwitterClientSecret || '1',
    callbackURL: 'https://api.websiter.dev/api/auth/twitter/redirect',
}

passport.use(
    new TwitterStrategy(
        passportConfig,
        async (accessToken, refreshToken, profile, done) => {
            try {
                let account = await Account.findById('t_' + profile.id)
                    .select('_id')
                    .lean()
                    .exec()
                if (!account) {
                    let name = profile.displayName || profile.username
                    name = name && name.length > 1 && name
                    account = new Account({
                        _id: 't_' + profile.id,
                        name: name || 't_' + profile.id,
                        platformId: 'twitter',
                        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                        accountInfo: {
                            displayName: profile.displayName,
                            emails: propfile.emails,
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
