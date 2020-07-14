const authNotForce = require('../middleware/authNotForce')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const express = require('express')
const getAccount = require('../utils/getAccount')

const router = express.Router()

router.get('/:_id*', authNotForce, async (req, res, next) => {
    try {
        const profile = await Account.findById(req.params._id)
            .select('name image friends goals progresses perks wallet wishlist')
            .lean()
        let account

        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name image friends wallet',
                false,
                true
            )
        }
        if (!profile) {
            res.send({
                account,
                success: false,
            })
            return
        }

        const progressesData = await Progress.find({
            _id: { $in: profile.progresses },
        })
            .lean()
            .exec()

        let friends = profile.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image')
            .lean()
            .exec()

        res.send({
            account,
            profile: {
                ...profile,
                friendsData: friends,
                progressesData,
            },
            success: true,
        })
    } catch (ex) {}
})

module.exports = router
