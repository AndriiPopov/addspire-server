const { User } = require('../models/user')
const { Account } = require('../models/account')

const getAccount = async (req, res, fields, notLean, notExit) => {
    let account
    if (req.user.currentAccount) {
        account = await Account.findById(req.user.currentAccount)
            .select(fields)
            .lean(!notLean)
            .exec()
    }
    if (!account) {
        account = await Account.findById(req.user.myAccount)
            .select(fields)
            .lean(!notLean)
            .exec()
        if (account) {
            user.currentAccount = user.myAccount
            user.save()
        }
    }
    if (!account && !notExit) {
        res.send({ status: 'no account' })
    }
    return account
}

module.exports = getAccount
