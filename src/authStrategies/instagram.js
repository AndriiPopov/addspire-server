const passport = require('passport')
const passportInstagram = require('passport-instagram').Strategy
const { User } = require('../models/user')

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
                let user = await User.findOne({
                    userid: profile.id,
                    platformId: 'instagram',
                })

                if (!user) {
                    user = new User({
                        userid: profile.id,
                        platformId: 'instagram',
                        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                        accountInfo: {
                            displayName: profile.displayName,
                            emails: profile.emails,
                            photos: profile.photos,
                        },
                    })
                    user.markModified('accountInfo')
                    await user.save()
                }
                return done(null, user)
            } catch {
                console.log('Create user failed.')
            }
        }
    )
)
