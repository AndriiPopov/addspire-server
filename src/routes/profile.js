const authNotForce = require('../middleware/authNotForce')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const express = require('express')
const getAccount = require('../utils/getAccount')
const { Reward } = require('../models/reward')

const router = express.Router()

router.get('/:_id*', authNotForce, async (req, res, next) => {
    try {
        const profile = await Account.findById(req.params._id)
            .select(
                'name image friends rewards progresses transactions wishlist followAccounts followingAccounts followProgresses'
            )
            .lean()

        if (!profile) {
            res.send({
                account,
                success: false,
            })
            return
        }

        const progressData = await Progress.find({
            _id: {
                $in: [
                    ...new Set([
                        ...profile.progresses,
                        ...profile.followProgresses,
                    ]),
                ],
            },
        })
            .lean()
            .exec()

        const rewardData = await Reward.find({
            _id: {
                $in: profile.rewards,
            },
        })
            .lean()
            .exec()

        let friends = [
            ...new Set([
                ...profile.friends.map(item => item.friend),
                ...profile.followAccounts,
                ...profile.followingAccounts,
            ]),
        ]
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image  notifications')
            .lean()
            .exec()

        res.send({
            profile,
            progressData,
            friendData: friends,
            rewardData,
            success: true,
        })
    } catch (ex) {}
})

module.exports = router
