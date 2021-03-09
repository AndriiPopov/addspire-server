const { Account } = require('../models/account')
const express = require('express')
const { Post } = require('../models/post')
const { Activity } = require('../models/activity')
const { mget } = require('../startup/redis')

const router = express.Router()

router.get('/:id', async (req, res, next) => {
    try {
        const activity = await Activity.findById(req.params.id)
            .lean()
            .exec()

        if (activity) {
            const posts = await Post.find({
                _id: { $in: activity.posts },
            })
                .lean()
                .exec()

            let accountIds = [
                activity.owner,
                ...activity.followers,
                ...activity.likes,
            ]

            for (let post of posts) {
                accountIds = [...accountIds, ...post.users]
            }

            accountIds = [...new Set(accountIds)]
            const friends = await Account.find({
                _id: { $in: accountIds },
            })
                .select('name image notifications')
                .lean()
                .exec()

            const onlineUsersKeys =
                accountIds && accountIds.length > 0
                    ? await mget(accountIds)
                    : []
            const onlineUsers = accountIds.filter(
                (item, index) => onlineUsersKeys[index]
            )

            // const activityData = await Activity.find({
            //     _id: { $in: progress.activities },
            // })
            //     .select('name images')
            //     .lean()
            //     .exec()

            // const rewardData = await Reward.find({
            //     _id: {
            //         $in: progress.rewards.map(
            //             reward => reward.reward
            //         ),
            //     },
            // })
            //     .select('name images')
            //     .lean()
            //     .exec()

            res.send({
                resource: activity,
                friendData: friends,
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
