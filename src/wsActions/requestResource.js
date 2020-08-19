const { User } = require('../models/user')
const Joi = require('@hapi/joi')
const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const { Transaction } = require('../models/transaction')
const { Post } = require('../models/post')
const { Group } = require('../models/group')

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
                case 'group':
                    result = await Group.find({
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

                    break
                case 'postData':
                    result = await Post.find({
                        _id: { $in: data.ids },
                    })
                        .select('notifications __v')
                        .lean()
                        .exec()

                    break
                case 'groupData':
                    result = await Group.find({
                        _id: { $in: data.ids },
                    })
                        .select('notifications __v name active')
                        .lean()
                        .exec()

                    break
                case 'progressData':
                    result = await Progress.find({
                        _id: { $in: data.ids },
                    })
                        .select('worker owner goal notifications __v name')
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
                default:
                    break
            }

            if (result && result.length > 0) {
                for (let item of result) {
                    ws.resources[data.type][item._id.toString()] = result[0].__v
                }
                ws.send(
                    JSON.stringify({
                        messageCode: 'addResource',
                        type: data.type,
                        resources: result,
                    })
                )
            } else {
                ws.send(
                    JSON.stringify({
                        messageCode: 'notFoundResource',
                        _id: data.id,
                    })
                )
            }
        }
    } catch (ex) {}
}
