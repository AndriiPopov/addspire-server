const authNotForce = require('../middleware/authNotForce')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const express = require('express')
const getAccount = require('../utils/getAccount')
const { Reward } = require('../models/reward')
const { Activity } = require('../models/activity')
const { mget } = require('../startup/redis')

const router = express.Router()

router.get('/:_id*', authNotForce, async (req, res, next) => {
    try {
        const profile = await Account.findById(req.params._id)
            .select(
                'name image friends rewards progresses transactions activities followAccounts followingAccounts followProgresses followRewards followActivities'
            )
            .lean()

        if (!profile) {
            res.send({
                success: false,
                home: true,
                account,
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
            .select('name images')
            .lean()
            .exec()

        const rewardData = await Reward.find({
            _id: {
                $in: [
                    ...new Set([...profile.rewards, ...profile.followRewards]),
                ],
            },
        })
            .select('name images')
            .lean()
            .exec()

        const activityData = await Activity.find({
            _id: {
                $in: [
                    ...new Set([
                        ...profile.activities,
                        ...profile.followActivities,
                    ]),
                ],
            },
        })
            .select('name images stages owner users')
            .lean()
            .exec()

        let accountIds = []

        for (let activity of activityData) {
            accountIds = [...accountIds, ...activity.users, activity.owner]
        }

        accountIds = [
            ...new Set([
                ...profile.friends.map(item => item.friend),
                ...profile.followAccounts,
                ...profile.followingAccounts,
            ]),
        ]

        const onlineUsersKeys = await mget(accountIds)
        const onlineUsers = accountIds.filter(
            (item, index) => onlineUsersKeys[index]
        )
        const friendData = await Account.find({
            _id: { $in: accountIds },
        })
            .select('name image  notifications')
            .lean()
            .exec()

        res.send({
            profile,
            progressData,
            friendData,
            rewardData,
            activityData,
            onlineUsers,
            success: true,
        })
    } catch (ex) {}
})

module.exports = router
