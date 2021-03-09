const express = require('express')
const { Account } = require('../models/account')
const router = express.Router()

router.post('/:id', async (req, res) => {
    try {
        let account = await Account.findOne({
            userid: req.params.id,
            platformId: 'test',
        })

        if (!account) {
            account = new User({
                _id: 'test_' + req.params.id,
                userid: req.params.id,
                platformId: 'test',
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                accountInfo: {
                    displayName: '',
                    emails: '',
                    photos: '',
                },
            })
            account.markModified('accountInfo')
            await account.save()
        }
        res.cookie('rememberme', true)
        const token = account.generateAuthToken()
        res.cookie('auth_token', token, {
            expires: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000),
        }).send({ cookie: token })
    } catch (ex) {}
})

module.exports = router
