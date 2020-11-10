const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const express = require('express')
const getAccount = require('../utils/getAccount')
const { Post } = require('../models/post')

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
                _id: { $in: progress.posts },
            })
                .lean()
                .exec()

            let accountIds = [
                progress.owner,
                ...progress.users,
                ...progress.followingAccounts,
                ...progress.likes,
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

            res.send({
                progress,
                friendData: friends,
                posts,
                success: true,
            })
            return
        } else console.log('send fail')
        res.send({
            success: false,
        })
    } catch (ex) {
        console.log(ex)
        res.send({
            success: false,
        })
    }
})

module.exports = router
