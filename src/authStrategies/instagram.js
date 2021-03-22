const passport = require('passport')
const passportInstagram = require('passport-instagram').Strategy
const { Account } = require('../models/account')

const passportConfig = {
    clientID: process.env.InstagramClientID || '1',
    clientSecret: process.env.InstagramClientSecret || '1',
    callbackURL: 'https://addspire.com/api/auth/instagram/redirect',
}

passport.use(
    new passportInstagram(
        passportConfig,
        async (accessToken, refreshToken, profile, done) => {
            try {
                let account = await Account.findById('i_' + profile.id)
                    .select('_id')
                    .lean()
                    .exec()
                if (!account) {
                    let name = profile.displayName || profile.username
                    name = name && name.length > 1 && name
                    account = new Account({
                        _id: 'i_' + profile.id,
                        name: name || 'i_' + profile.id,
                        platformId: 'instagram',
                        userid: profile.id,
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
            } catch {
                console.log('Create user failed.')
            }
        }
    )
)
