const auth = require('../middleware/auth');

const {
  User
} = require('../models/user');

const {
  Account
} = require('../models/account');

const express = require('express');

const getAccount = require('../utils/getAccount');

const router = express.Router();
router.get('/', auth, async (req, res, next) => {
  try {
    let account = await getAccount(req, res, 'name friends');
    if (!account) return;
    let friends = account.friends.filter(item => item.status === 'friend').map(item => item.friend);
    friends = Account.find({
      _id: {
        $in: friends
      }
    }).select('name image').lean().exec();
    res.send({
      account: { ...account,
        friendsData: friends
      }
    });
  } catch (ex) {}
});
router.post('/', auth, async (req, res, next) => {
  try {
    let account = await getAccount(req, res, '', true);
    if (!account) return;
    account.name = req.body.name;
    account.save();
    res.send({
      success: true
    });
  } catch (ex) {}
});
module.exports = router;