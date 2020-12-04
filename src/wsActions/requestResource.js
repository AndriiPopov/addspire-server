const { User } = require('../models/user')
const Joi = require('@hapi/joi')
const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const { Transaction } = require('../models/transaction')
const { Post } = require('../models/post')
const { Reward } = require('../models/reward')
const { Activity } = require('../models/activity')
const { get } = require('../startup/redis')

// const validateSchema = Joi.object({
//     ids: Joi.array().items(Joi.string().optional()),
//     type: Joi.string().valid('user', 'website', 'resource'),
// }).unknown()

module.exports.requestResource = async (data, ws) => {
    try {
        // const { error } = validateSchema.validate(data)
        // if (error) return

        //Compare and send not found resources!!!!!!!!
        let result
        const onlineUsers = []
        if (data.type && data.ids && data.ids.length > 0) {
            switch (data.type) {
                case 'user':
                    result = await User.find({
                        _id: { $in: data.ids },
                    })
                        .lean()
                        .exec()

                    break
                case 'account':
                    result = await Account.find({
                        _id: { $in: data.ids },
                    })
                        .lean()
                        .exec()
                    for (let user of data.ids)
                        if (await get(user)) onlineUsers.push(user)

                    break
                case 'progress':
                    result = [
                        await Progress.findOneAndUpdate(
                            {
                                _id: { $in: data.ids },
                            },
                            { $inc: { views: 1 } }
                        )
                            .lean()
                            .exec(),
                    ]
                    break
                case 'post':
                    result = await Post.find({
                        _id: { $in: data.ids },
                    })
                        .lean()
                        .exec()
                    break

                case 'reward':
                    result = await Reward.find({
                        _id: { $in: data.ids },
                    })
                        .lean()
                        .exec()
                    break

                case 'activity':
                    result = await Activity.find({
                        _id: { $in: data.ids },
                    })
                        .lean()
                        .exec()
                    break

                case 'friendData':
                    result = await Account.find({
                        _id: { $in: data.ids },
                    })
                        .select('name image notifications __v')
                        .lean()
                        .exec()
                    for (let user of data.ids)
                        if (await get(user)) onlineUsers.push(user)

                    break
                case 'postData':
                    result = await Post.find({
                        _id: { $in: data.ids },
                    })
                        .select('notifications __v')
                        .lean()
                        .exec()

                    break

                case 'progressData':
                    result = await Progress.find({
                        _id: { $in: data.ids },
                    })
                        .select(
                            'worker owner notifications __v name views images'
                        )
                        .lean()
                        .exec()

                    break
                case 'transactionData':
                    result = await Transaction.find({
                        _id: { $in: data.ids },
                    })
                        .lean()
                        .exec()

                    break
                case 'rewardData':
                    result = await Reward.find({
                        _id: { $in: data.ids },
                    })
                        .select('name owner images likes wish __v')
                        .lean()
                        .exec()
                    break
                case 'activityData':
                    result = await Activity.find({
                        _id: { $in: data.ids },
                    })
                        .select('name owner images likes stages users __v')
                        .lean()
                        .exec()

                    // const posts = await Post.find({
                    //     _id: { $in: rewards.map(item => item.post) },
                    // })
                    //     .select('startMessage.likes __v')
                    //     .lean()
                    //     .exec()

                    // result = rewards.map(reward => {
                    //     const post = posts.find(
                    //         item => item._id === reward.post
                    //     )

                    //     return {
                    //         ...reward,
                    //         likes:
                    //             (post &&
                    //                 post.startMessage &&
                    //                 post.startMessage.likes) ||
                    //             0,
                    //     }
                    // })

                    break
                default:
                    break
            }

            if (result && result.length > 0) {
                for (let item of result) {
                    if (item)
                        ws.resources[data.type][item._id.toString()] =
                            result[0].__v
                }
                ws.send(
                    JSON.stringify({
                        messageCode: 'addResource',
                        type: data.type,
                        resources: result.filter(item => item),
                        newOnlineUsers: onlineUsers,
                    })
                )
            } else {
                if (
                    [
                        'user',
                        'account',
                        'progress',
                        'post',
                        'reward',
                        'activity',
                    ].includes(data.type)
                ) {
                    ws.send(
                        JSON.stringify({
                            messageCode: '404',
                        })
                    )
                }
                ws.send(
                    JSON.stringify({
                        messageCode: 'notFoundResource',
                        _id: data.ids,
                    })
                )
            }
        }
    } catch (ex) {
        console.log(ex)
    }
}
