const passport = require('passport')
const TwitterStrategy = require('passport-twitter').Strategy
const { User } = require('../models/user')

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
                let user = await User.findOne({
                    userid: profile.id,
                    platformId: 'twitter',
                })
                if (!user) {
                    user = new User({
                        userid: profile.id,
                        platformId: 'twitter',
                        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                        accountInfo: {
                            displayName: profile.displayName,
                            emails: propfile.emails,
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
