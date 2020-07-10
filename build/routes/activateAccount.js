const auth = require('../middleware/auth');

const {
  User
} = require('../models/user');

const {
  Account
} = require('../models/account');

const express = require('express');

const router = express.Router();
router.post('/', auth, async (req, res, next) => {
  try {
    const _id = req.body.nickname.toLowerCase();

    const nicknmaeNotUnique = await Account.count({
      _id
    });

    if (nicknmaeNotUnique > 0) {
      res.send({
        nicknameNotUnique: true
      });
      return;
    }

    let account = new Account({
      _id,
      name: req.body.name,
      status: 'activated'
    });
    await account.save();
    req.user.myAccount = account._id;
    req.user.currentAccount = account._id;
    req.user.save();
    res.send({
      success: true
    });
  } catch (ex) {
    console.log(ex);
  }
});
module.exports = router;