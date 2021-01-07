const authNotForce = require('../middleware/authNotForce')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const express = require('express')
const getAccount = require('../utils/getAccount')
const { Reward } = require('../models/reward')
const { Activity } = require('../models/activity')
const { mget } = require('../startup/redis')
const { Post } = require('../models/post')

const router = express.Router()

router.get('/:_id*', authNotForce, async (req, res, next) => {
    try {
        const profile = await Account.findById(req.params._id)
            .select(
                'name image structure friends rewards progresses transactions activities followAccounts followingAccounts followProgresses followRewards followActivities'
            )
            .lean()
            .exec()

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
                $in: profile.followProgresses,
            },
        })
            .select('name images')
            .lean()
            .exec()

        const progress = await Progress.find({
            _id: {
                $in: profile.progresses,
            },
        })
            .lean()
            .exec()

        const rewardData = await Reward.find({
            _id: {
                $in: profile.followRewards,
            },
        })
            .select('name images')
            .lean()
            .exec()

        const reward = await Reward.find({
            _id: {
                $in: profile.rewards,
            },
        })
            .lean()
            .exec()

        const activityData = await Activity.find({
            _id: {
                $in: profile.followActivities,
            },
        })
            .select('name images stages owner users')
            .lean()
            .exec()

        const activity = await Activity.find({
            _id: {
                $in: profile.activities,
            },
        })
            .lean()
            .exec()

        const post = await Post.find({
            _id: {
                $in: [
                    ...reward.reduce((acc, val) => [...acc, ...val.posts], []),
                    ...activity.reduce(
                        (acc, val) => [...acc, ...val.posts],
                        []
                    ),
                    ...progress.reduce(
                        (acc, val) => [...acc, ...val.posts],
                        []
                    ),
                ],
            },
        })
            .lean()
            .exec()

        let accountIds = [
            ...new Set([
                ...reward.reduce(
                    (acc, val) => [
                        ...acc,
                        val.owner,
                        ...val.followingAccounts,
                        ...val.likes,
                    ],
                    []
                ),
                ...progress.reduce(
                    (acc, val) => [
                        ...acc,
                        val.owner,
                        ...val.followingAccounts,
                        ...val.likes,
                    ],
                    []
                ),
                ...activity.reduce(
                    (acc, val) => [
                        ...acc,
                        val.owner,
                        ...val.followingAccounts,
                        ...val.likes,
                        ...val.users,
                    ],
                    []
                ),
                ...post.reduce((acc, val) => [...acc, ...val.users], []),
                ...profile.friends.map(item => item.friend),
                ...profile.followAccounts,
                ...profile.followingAccounts,
            ]),
        ]

        const onlineUsersKeys =
            accountIds && accountIds.length > 0 ? await mget(accountIds) : []
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
            activity,
            progress,
            reward,
            post,
            onlineUsers,
            success: true,
        })
    } catch (ex) {}
})

module.exports = router
