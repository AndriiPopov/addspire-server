const passport = require('passport')
const passportGithub = require('passport-github').Strategy
const { Account } = require('../models/account')

const passportConfig = {
    clientID: process.env.GithubClientID,
    clientSecret: process.env.GithubClientSecret,
    callbackURL:
        process.env.NODE_ENV === 'production'
            ? 'https://addspire.com/api/auth/github/redirect'
            : 'http://my.websiter.test:5000/api/auth/github/redirect',
    passReqToCallback: true,
}

passport.use(
    new passportGithub(
        passportConfig,
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                let account = await Account.findById('h_' + profile.id)
                    .select('_id')
                    .lean()
                    .exec()
                if (!account) {
                    let name = profile.displayName || profile.username
                    name = name && name.length > 1 && name
                    account = new Account({
                        _id: 'h_' + profile.id,
                        name: name || 'h_' + profile.id,
                        userid: profile.id,
                        platformId: 'github',
                        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                        accountInfo: {
                            displayName: profile.displayName,
                            emails: profile.emails,
                            photos: profile.photos,
                            userid: profile.id,
                        },
                        accessToken,
                        refreshToken,
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
                console.log(ex)
                console.log('Create user failed.')
            }
        }
    )
)
