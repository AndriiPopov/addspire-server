const auth = require('../middleware/auth');

const authNotForce = require('../middleware/authNotForce');

const {
  User
} = require('../models/user');

const {
  Account
} = require('../models/account');

const {
  Transaction
} = require('../models/transaction');

const express = require('express');

const getAccount = require('../utils/getAccount');

const router = express.Router();
router.get('/', auth, async (req, res, next) => {
  try {
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'name friends wallet perks transactions');
    }

    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
      _id: {
        $in: friends
      }
    }).select('name image').lean().exec();
    const transactions = await Transaction.find({
      _id: {
        $in: account.transactions
      }
    }).lean().exec();
    res.send({
      account: { ...account,
        friendsData: friends,
        transactionsData: transactions
      },
      success: true
    });
  } catch (ex) {}
});
router.get('/:_id/:perkId', authNotForce, async (req, res, next) => {
  try {
    let profile = await Account.findById(req.params._id).select({
      perks: {
        $elemMatch: {
          perkId: req.params.perkId
        }
      },
      friends: 1
    }).lean().exec();
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'name image friends', false, true);
    }

    if (profile && profile.perks && profile.perks.length > 0) {
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
        perk: profile.perks[0],
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
      account = await getAccount(req, res, 'name friends perks currentId transactions wallet', true);
    }

    let perkId = req.body.id;

    if (perkId) {
      account.perks = account.toObject().perks.map(perk => {
        if (perk.perkId === perkId) return { ...perk,
          ...req.body.value
        };else return perk;
      });
    } else {
      perkId = 'perk_' + account.currentId;
      account.currentId = account.currentId + 1;
      account.perks = [{
        perkId,
        ...req.body.value
      }, ...account.perks];
    }

    account.save();
    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
      _id: {
        $in: friends
      }
    }).select('name image goals').lean().exec();
    const transactions = await Transaction.find({
      _id: {
        $in: account.transactions
      }
    }).lean().exec();
    res.send({
      account: { ...account.toObject(),
        friendsData: friends,
        transactionsData: transactions
      },
      success: true
    });
  } catch (ex) {}
});
router.post('/buy', auth, async (req, res) => {
  try {
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'transactions wallet perks friends name image goals progresses', true);
    }

    const owner = req.body.ownerId !== account._id ? await Account.findById(req.body.ownerId).select('transactions wallet perks friends name image goals progresses').exec() : account;
    const perkId = req.body.perkId;

    if (owner && account && perkId) {
      const accountInFriends = owner.friends.find(item => item.friend === account._id);

      if (accountInFriends && accountInFriends.status === 'friend' || owner._id === account._id) {
        const perk = owner.perks.find(item => item.perkId === perkId);
        const currency = account.wallet.find(item => item.user === owner._id);

        if (perk && currency && perk.price <= currency.amount) {
          console.log(perk);
          let transaction = new Transaction({
            from: owner._id,
            to: account._id,
            item: {
              itemName: perk.name,
              itemDescription: perk.description,
              itemImages: perk.images,
              mode: 'item'
            },
            amount: perk.price,
            status: 'Not confirmed'
          });
          transaction.markModified('item');
          transaction = await transaction.save();
          if (owner.transactions) owner.transactions.unshift(transaction._id.toString());else owner.transactions = [transaction._id.toString()];

          if (owner._id !== account._id) {
            if (account.transactions) account.transactions.unshift(transaction._id.toString());else account.transactions = [transaction._id.toString()];
          }

          currency.amount = currency.amount - perk.price;
          await owner.save();
          if (owner._id !== account._id) await account.save();
          let friends = owner.friends.map(item => item.friend);
          friends = await Account.find({
            _id: {
              $in: friends
            }
          }).select('name image').lean().exec();
          const transactions = await Transaction.find({
            _id: {
              $in: owner.transactions
            }
          }).lean().exec();
          res.send({
            account: account.toObject(),
            profile: { ...owner.toObject(),
              friendsData: friends,
              transactionsData: transactions
            },
            success: true
          });
          return;
        }
      }
    }

    res.send({
      success: false
    });
  } catch (ex) {
    console.log(ex);
  }
});
router.post('/delete/:id', auth, async (req, res) => {
  try {
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'name friends perks currentId', true);
    }

    const perkId = req.params.id;

    if (perkId) {
      account.perks = account.toObject().perks.filter(perk => perk.perkId !== perkId);
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
router.post('/confirm', auth, async (req, res) => {
  try {
    await Transaction.findOneAndUpdate({
      _id: req.body.transactionId
    }, {
      status: 'Confirmed'
    });
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'name friends wallet perks transactions');
    }

    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
      _id: {
        $in: friends
      }
    }).select('name image').lean().exec();
    const transactions = await Transaction.find({
      _id: {
        $in: account.transactions
      }
    }).lean().exec();
    res.send({
      account: { ...account,
        friendsData: friends,
        transactionsData: transactions
      },
      success: true
    });
  } catch (ex) {
    console.log(ex);
  }
});
router.post('/cancel', auth, async (req, res) => {
  try {
    let account;

    if (req.user) {
      account = await getAccount(req, res, 'name friends wallet perks transactions', true);
    }

    const transaction = await Transaction.findOneAndUpdate({
      _id: req.body.transactionId
    }, {
      status: 'Cancelled'
    });
    const buyer = account._id === transaction.to ? account : await Account.findById(transaction.to).select('walet').exec();
    const currency = buyer.wallet.find(item => item.user === transaction.from);
    currency.amount = currency.amount + transaction.amount;
    await buyer.save();
    let friends = account.friends.map(item => item.friend);
    friends = await Account.find({
      _id: {
        $in: friends
      }
    }).select('name image').lean().exec();
    const transactions = await Transaction.find({
      _id: {
        $in: account.transactions
      }
    }).lean().exec();
    res.send({
      account: { ...account.toObject(),
        friendsData: friends,
        transactionsData: transactions
      },
      success: true
    });
  } catch (ex) {
    console.log(ex);
  }
});
module.exports = router;