const { Account } = require('../models/account')

const getAccount = async (req, res, fields, notLean, notExit) => {
    let account
    if (req.account.currentAccount) {
        account = await Account.findById(req.account)
            .select(fields)
            .lean(!notLean)
            .exec()
    }

    if (!account && !notExit) {
        res.send({ status: 'no account' })
    }
    return account
}

module.exports = getAccount
