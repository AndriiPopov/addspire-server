const passport = require('passport');

const passportGithub = require('passport-github').Strategy;

const {
  User
} = require('../models/user');

const passportConfig = {
  clientID: process.env.GithubClientID,
  clientSecret: process.env.GithubClientSecret,
  callbackURL: process.env.NODE_ENV === 'production' ? 'https://my.websiter.dev/api/auth/github/redirect' : 'http://my.websiter.test:5000/api/auth/github/redirect',
  passReqToCallback: true
};
passport.use(new passportGithub(passportConfig, async (req, accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({
      userid: profile.id,
      platformId: 'github'
    });

    if (!user) {
      user = new User({
        userid: profile.id,
        platformId: 'github',
        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
        accountInfo: {
          displayName: profile.displayName,
          emails: profile.emails,
          photos: profile.photos
        }
      });
      user.markModified('accountInfo');
      await user.save();
    }

    return done(null, user);
  } catch {
    console.log('Create user failed.');
  }
}));