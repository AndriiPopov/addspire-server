const express = require('express');

const {
  User
} = require('../models/user');

const router = express.Router();
router.post('/:id', async (req, res) => {
  try {
    let user = await User.findOne({
      userid: req.params.id,
      platformId: 'test'
    });

    if (!user) {
      user = new User({
        userid: req.params.id,
        platformId: 'test',
        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
        accountInfo: {
          displayName: '',
          emails: '',
          photos: ''
        }
      });
      user.markModified('accountInfo');
      await user.save();
    }

    res.cookie('rememberme', true);
    const token = user.generateAuthToken();
    res.cookie('auth_token', token, {
      expires: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000)
    }).send({
      cookie: token
    });
  } catch (ex) {}
});
module.exports = router;