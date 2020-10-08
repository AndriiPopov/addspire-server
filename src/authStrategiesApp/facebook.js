const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const { User } = require('../models/user')

const passportConfig = {
    clientID: process.env.FBClientID || '1',
    clientSecret: process.env.FBClientSecret || '1',
    callbackURL: 'https://addspire.com/api/authApp/facebook/redirect',
}

passport.use(
    'facebookapp',
    new FacebookStrategy(
        passportConfig,
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({
                    userid: profile.id,
                    platformId: 'facebook',
                })
                if (!user) {
                    user = new User({
                        userid: profile.id,
                        platformId: 'facebook',
                        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                        accountInfo: {
                            displayName: profile.displayName,
                            emails: profile.emails,
                            photos: profile.photos,
                        },
                    })
                    user.markModified('accountInfo')
                    user = await user.save()
                }
                return done(null, user)
            } catch (ex) {
                console.log('Create user failed.')
                console.log(ex)
            }
        }
    )
)
