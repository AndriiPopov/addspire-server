const auth = require('../middleware/auth');

const bcrypt = require('bcryptjs');

const express = require('express');

const getAccount = require('../utils/getAccount');

const {
  Account
} = require('../models/account');

const router = express.Router();
router.get('/', auth, async (req, res, next) => {
  try {
    let account = await getAccount(req, res, 'name friends');
    if (!account) return;
    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
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
router.post('/find', auth, async (req, res) => {
  try {
    const id = req.body.search.toLowerCase();
    const friend = await Account.findById(id).select('image name').lean();

    if (friend) {
      res.send({
        friend,
        success: true
      });
    } else {
      res.send({
        success: false
      });
    }
  } catch (ex) {}
});
router.post('/add', [auth], async (req, res) => {
  try {
    const friendId = req.body.id;
    let account = await getAccount(req, res, 'friends name', true);
    if (!account) return;

    if (account._id.toString() === friendId) {
      res.send({
        success: false
      });
      return;
    }

    const friend = await Account.findById(friendId).select('friends ').exec();

    if (friend) {
      if (!account.friends.some(item => item.friend.toString() === friend._id.toString())) {
        account.friends.unshift({
          friend: friend._id,
          status: 'invited'
        });
      }

      if (!friend.friends.some(item => item.friend.toString() === account._id.toString())) {
        friend.friends.unshift({
          friend: account._id,
          status: 'inviting'
        });
      }

      await friend.save();
      await account.save();
      let friends = account.friends.map(item => item.friend);
      friends = await Account.find({
        _id: {
          $in: friends
        }
      }).select('name image').lean().exec();
      res.send({
        account: { ...account.toObject(),
          friendsData: friends
        },
        success: true
      });
    } else {
      res.send({
        success: false
      });
    }
  } catch (ex) {
    console.log(ex);
  }
});
router.post('/accept', [auth], async (req, res) => {
  try {
    const friendId = req.body.id;
    const friend = await Account.findById(friendId).select('friends');
    let account = await getAccount(req, res, 'name friends', true);

    if (account._id.toString() === friendId) {
      res.send({
        success: false
      });
      return;
    }

    if (friend) {
      account.friends = account.friends.map(item => {
        if (item.friend.toString() === friendId.toString()) return { ...item.toObject(),
          status: 'friend'
        };else return item.toObject();
      });
      friend.friends = friend.friends.map(item => {
        if (item.friend.toString() === account._id.toString()) return { ...item.toObject(),
          status: 'friend'
        };else return item.toObject();
      });
      account.save();
      friend.save();
    } else {
      account.friends = account.friends.filter(item => item.friend.toString() !== friendId);
      account.save();
    }

    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
      _id: {
        $in: friends
      }
    }).select('name image').lean().exec();
    res.send({
      account: { ...account.toObject(),
        friendsData: friends
      },
      success: true
    });
  } catch (ex) {}
});
router.post('/unfriend', [auth], async (req, res) => {
  try {
    const friendId = req.body.id;
    let account = await getAccount(req, res, 'name friends', true);

    if (account._id.toString() === friendId) {
      res.send({
        success: false
      });
      return;
    }

    account.friends = account.friends.filter(item => item.friend.toString() !== friendId.toString());
    account.save();
    const friend = await Account.findById(friendId).select('friends');

    if (friend) {
      friend.friends = friend.friends.filter(item => item.friend.toString() !== account._id.toString());
      friend.save();
    }

    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
      _id: {
        $in: friends
      }
    }).select('name image').lean().exec();
    res.send({
      account: { ...account.toObject(),
        friendsData: friends
      },
      success: true
    });
  } catch (ex) {}
});
module.exports = router;