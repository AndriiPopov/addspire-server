const passport = require('passport')
const passportGoogle = require('passport-google-oauth').OAuth2Strategy
const { User } = require('../models/user')

const passportConfig = {
    clientID: process.env.GoogleClientID,
    clientSecret: process.env.GoogleClientSecret,
    callbackURL: 'https://addspire.com/api/appauth/google/redirect',
}

passport.use(
    'googleapp',
    new passportGoogle(
        passportConfig,
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({
                    userid: profile.id,
                    platformId: 'google',
                })

                if (!user) {
                    user = new User({
                        userid: profile.id,
                        platformId: 'google',
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
