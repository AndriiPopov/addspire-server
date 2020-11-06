const auth = require('../middleware/auth')
const authNotForce = require('../middleware/authNotForce')

const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const express = require('express')
const getAccount = require('../utils/getAccount')
const { Post } = require('../models/post')

const router = express.Router()

router.get('/:id', authNotForce, async (req, res, next) => {
    try {
        console.log('start')

        const progress = await Progress.findOneAndUpdate(
            { _id: req.params.id },
            { $inc: { views: 1 } }
        )
            .lean()
            .exec()
        console.log(progress)
        if (progress) {
            console.log('go further')

            let accountIds = [
                progress.owner,
                ...progress.goal.users,
                ...progress.followingAccounts,
                ...progress.likes,
            ]

            accountIds = [...new Set(accountIds)]
            const friends = await Account.find({
                _id: { $in: accountIds },
            })
                .select('name image notifications')
                .lean()
                .exec()

            const posts = await Post.find({
                _id: { $in: progress.posts },
            })
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
