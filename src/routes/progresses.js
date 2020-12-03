const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const express = require('express')
const getAccount = require('../utils/getAccount')
const { Post } = require('../models/post')
const { Activity } = require('../models/activity')
const { Reward } = require('../models/reward')
const { mget } = require('../startup/redis')
const router = express.Router()

router.get('/:id', async (req, res, next) => {
    try {
        const progress = await Progress.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { views: 1 } }
        )
            .lean()
            .exec()
        if (progress) {
            const posts = await Post.find({
                _id: {
                    $in: progress.posts,
                },
            })
                .lean()
                .exec()

            let accountIds = [
                progress.owner,
                ...progress.followingAccounts,
                ...progress.likes,
            ]

            for (let post of posts) {
                accountIds = [...accountIds, ...post.users]
            }

            const activityData = await Activity.find({
                _id: {
                    $in: progress.activities,
                },
            })
                .select('name images stages owner users')
                .lean()
                .exec()

            for (let activity of activityData) {
                accountIds = [...accountIds, ...activity.users, activity.owner]
            }

            accountIds = [...new Set(accountIds)]
            const friends = await Account.find({
                _id: {
                    $in: accountIds,
                },
            })
                .select('name image notifications')
                .lean()
                .exec()

            const onlineUsersKeys = await mget(accountIds)
            const onlineUsers = accountIds.filter(
                (item, index) => onlineUsersKeys[index]
            )

            const rewardData = await Reward.find({
                _id: {
                    $in: progress.rewards.map(reward => reward.reward),
                },
            })
                .select('name images')
                .lean()
                .exec()

            res.send({
                resource: progress,
                friendData: friends,
                activityData,
                rewardData,
                posts,
                onlineUsers,
                success: true,
            })
            return
        }
        res.send({
            success: false,
            home: true,
        })
    } catch (ex) {
        console.log(ex)
        res.send({
            success: false,
        })
    }
})

module.exports = router
