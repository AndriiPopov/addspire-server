const auth = require('../middleware/auth');

const authNotForce = require('../middleware/authNotForce');

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
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'name friends goals');
    }

    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
      _id: {
        $in: friends
      }
    }).select('name image goals').lean().exec();
    res.send({
      account: { ...account,
        friendsData: friends
      },
      success: true
    });
  } catch (ex) {}
});
router.get('/:_id/:goalId', authNotForce, async (req, res, next) => {
  try {
    let profile = await Account.findById(req.params._id).select({
      goals: {
        $elemMatch: {
          goalId: req.params.goalId
        }
      },
      friends: 1
    }).lean().exec();
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'name image friends goals', false, true);
    }

    if (profile && profile.goals && profile.goals.length > 0) {
      let friends = profile.friends.map(item => item.friend);
      friends = await Account.find({
        _id: {
          $in: friends
        }
      }).select('name image').lean().exec();
      res.send({
        account,
        profile: {
          friendsData: friends
        },
        goal: profile.goals[0],
        success: true
      });
    } else {
      res.send({
        account,
        success: false
      });
    }
  } catch (ex) {}
});
router.post('/add', auth, async (req, res) => {
  try {
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'name friends goals currentId', true);
    }

    let goalId = req.body.id;

    if (goalId) {
      account.goals = account.toObject().goals.map(goal => {
        if (goal.goalId === goalId) return { ...goal,
          ...req.body.value
        };else return goal;
      });
    } else {
      goalId = 'goal_' + account.currentId;
      account.currentId = account.currentId + 1;
      account.goals = [{
        goalId,
        ...req.body.value
      }, ...account.goals];
    }

    account.save();
    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
      _id: {
        $in: friends
      }
    }).select('name image goals').lean().exec();
    res.send({
      account: { ...account.toObject(),
        friendsData: friends
      },
      success: true
    });
  } catch (ex) {}
});
router.post('/delete/:id', auth, async (req, res) => {
  try {
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'name friends goals currentId', true);
    }

    const goalId = req.params.id;

    if (goalId) {
      account.goals = account.toObject().goals.filter(goal => goal.goalId !== goalId);
    }

    account.save();
    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
      _id: {
        $in: friends
      }
    }).select('name image goals').lean().exec();
    res.send({
      account: { ...account.toObject(),
        friendsData: friends
      },
      success: true
    });
  } catch (ex) {}
});
router.delete('/:id', [auth], async (req, res) => {
  try {
    let goalId = req.params.id;

    if (goalId) {
      req.user.goals = req.user.goals.filter(goal => goal.goalId !== goalId);
      req.user.save();
    }

    res.send({
      goalId
    });
  } catch (ex) {}
});
module.exports = router;