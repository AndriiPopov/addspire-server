const { Account } = require('../models/account')
const express = require('express')
const { Post } = require('../models/post')
const { Reward } = require('../models/reward')

const router = express.Router()

router.get('/:id', async (req, res, next) => {
    try {
        const reward = await Reward.findById(req.params.id)
            .lean()
            .exec()

        if (reward) {
            const post = await Post.findById(reward.post)
                .lean()
                .exec()

            if (post) {
                const friends = await Account.find({
                    _id: { $in: post.users },
                })
                    .select('name image notifications')
                    .lean()
                    .exec()

                res.send({
                    reward,
                    friendData: friends,
                    post,
                    success: true,
                })
                return
            }
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
