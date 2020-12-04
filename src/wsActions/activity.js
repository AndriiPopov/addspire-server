const { Activity } = require('../models/activity')
const { Account } = require('../models/account')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendError, sendSuccess } = require('./confirm')
const { Post } = require('../models/post')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { updateStages } = require('../utils/updateStages')
const { Progress } = require('../models/progress')
const dayjs = require('dayjs')
var minMax = require('dayjs/plugin/minMax')
const getStageStartEnd = require('../utils/getStageStartEnd')

dayjs.extend(minMax)
dayjs().format()

module.exports.saveActivity = async (data, ws) => {
    try {
        if (data.accountId) {
            const account = await Account.findById(data.accountId).select(
                '__v activities wishlist notifications myPosts'
            )
            if (account) {
                const newData = {
                    name: data.activity.name,
                    images: data.activity.images,
                    description: data.activity.description,
                    descriptionText: data.activity.descriptionText,
                    repeat: data.activity.repeat,
                    days: data.activity.days,
                    category: data.activity.category,
                }
                const newNotificationId = await getNotificationId()

                if (data.activity._id) {
                    let activity = await Activity.findById(data.activity._id)
                    if (activity) {
                        activity = Object.assign(activity, newData)
                        updateStages(activity)
                        // const newNotificationIdPost = await getNotificationId()

                        // await Post.findOneAndUpdate(
                        //     { _id: activity.post },
                        //     {
                        //         $set: {
                        //             startMessage: {
                        //                 author: account._id,
                        //                 text: newData.description,
                        //                 action: 'edit activity',
                        //                 image: newData.images,
                        //                 messageId: '0',
                        //                 messageType: 'activity',
                        //                 details: {
                        //                     owner: account._id,
                        //                     name: newData.name,
                        //                     itemId: activity._id,
                        //                 },
                        //             },
                        //         },
                        //         $push: {
                        //             notifications: {
                        //                 $each: [
                        //                     {
                        //                         user: account._id,
                        //                         code: 'edit activity',
                        //                         notId: newNotificationIdPost,
                        //                         details: {
                        //                             itemId: activity._id,
                        //                         },
                        //                     },
                        //                 ],
                        //                 $position: 0,
                        //                 $slice: 20,
                        //             },
                        //         },
                        //     },
                        //     { useFindAndModify: false }
                        // )
                        await activity.save()
                        addNotification(account, {
                            user: account._id,
                            code: 'edit activity',
                            notId: newNotificationId,
                            details: {
                                itemId: activity._id,
                                itemName: newData.name,
                            },
                        })
                    }
                } else {
                    const activity = new Activity({
                        ...newData,
                        owner: account._id,
                    })
                    // const post = new Post({
                    //     users: [data.accountId],
                    //     parent: {
                    //         parentId: activity._id,
                    //         parentType: 'activity',
                    //     },
                    //     startMessage: {
                    //         author: data.accountId,
                    //         text: newData.description,
                    //         action: 'add activity',
                    //         image: newData.images,
                    //         messageId: '0',
                    //         messageType: 'activity',
                    //         details: {
                    //             owner: data.accountId,
                    //             name: newData.name,
                    //             itemId: activity._id,
                    //         },
                    //     },
                    // })
                    // await post.save()
                    // activity.post = post._id

                    // account.myPosts.push(post._id.toString())
                    await activity.save()

                    addNotification(account, {
                        user: account._id,
                        code: 'add activity',
                        notId: newNotificationId,
                        details: {
                            itemName: newData.name,
                            itemId: activity._id,
                        },
                    })
                    account.activities.push(activity._id)
                    // account.myPosts.push(post._id.toString())
                }
                await account.save()
                sendSuccess(ws)
                return
            }
        }
        sendError(ws)
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.changeLikesActivity = async (data, ws) => {
    try {
        if (data.activityId && data.accountId) {
            if (data.add) {
                await Activity.updateOne(
                    { _id: data.activityId },
                    { $addToSet: { likes: data.accountId } },
                    { useFindAndModify: false }
                )
            } else {
                await Activity.updateOne(
                    { _id: data.activityId },
                    { $pull: { likes: data.accountId } },
                    { useFindAndModify: false }
                )
            }
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.deleteActivity = async (data, ws) => {
    try {
        if (data.activityId && data.accountId) {
            await Activity.deleteOne({ _id: data.activityId })
            await Account.updateOne(
                { _id: data.accountId },
                { $pull: { activities: data.activityId } },
                { useFindAndModify: false }
            )
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.changeStage = async (data, ws) => {
    try {
        const activity = await Activity.findById(data.activityId)
        const { accountId } = data

        if (
            activity &&
            (data.accountId === activity.owner ||
                activity.users.includes(data.accountId))
        ) {
            const stage = activity.stages.find(
                stage => stage.stageId === data.stageId
            )

            if (stage) {
                let newNotificationId = await getNotificationId()
                const not = {
                    user: data.accountId,

                    notId: newNotificationId,
                    details: {
                        stageId: stage.stageId,
                        year: stage.year,
                        month: stage.month,
                        week: stage.week,
                        day: stage.day,
                        progressId: activity._id,
                        progressName: activity.name,
                    },
                    code: 'stage progress',
                }
                stage.approvedBy = stage.approvedBy.filter(
                    item => item.accountId !== data.accountId
                )
                stage.failBy = stage.failBy.filter(
                    item => item.accountId !== data.accountId
                )
                if (activity.owner === data.accountId) stage.dismissed = false
                switch (data.value) {
                    case 'complete':
                        stage.approvedBy.push({
                            accountId: data.accountId,
                        })
                        not.code = 'stage approve'
                        break
                    case 'fail':
                        stage.failBy.push({
                            accountId: data.accountId,
                        })
                        not.code = 'stage fail'
                        break
                    case 'dismissed':
                        if (activity.owner === data.accountId)
                            stage.dismissed = true
                        not.code = 'stage dismiss'
                        break
                    default:
                        break
                }
                addNotification(activity, not)

                // Pay and create transaction if unpaid

                if (
                    stage.status !== 'paid' &&
                    stage.approvedBy.find(
                        item => item.accountId === activity.owner
                    )
                ) {
                    newNotificationId = await getNotificationId()
                    addNotification(activity, {
                        code: 'stage complete',
                        notId: newNotificationId,
                        details: {
                            progressId: activity._id,
                            progressName: activity.name,
                            stageId: stage.stageId,
                            year: stage.year,
                            month: stage.month,
                            week: stage.week,
                            day: stage.day,
                        },
                    })
                    stage.status = 'paid'

                    for (let goalId of activity.goals) {
                        const goal = await Progress.findById(goalId)
                            .select('rewards name')
                            .lean()
                            .exec()
                        if (goal) {
                            for (let rewardObj of goal.rewards) {
                                if (
                                    rewardObj.activities.length === 1 &&
                                    rewardObj.activities[0] ===
                                        data.activityId &&
                                    rewardObj.repeat !== 'manual'
                                ) {
                                    const rewardObject = await Reward.findById(
                                        rewardObj.reward
                                    )
                                        .select('name owner images')
                                        .lean()
                                        .exec()
                                    if (rewardObject) {
                                        const owner = await Account.findById(
                                            rewardObj.owner
                                        )
                                            .select('transactions __v')
                                            .exec()
                                        const beniciaries = activity.users
                                        for (let reciever of beniciaries) {
                                            const worker =
                                                owner._id.toString() !==
                                                reciever.toString()
                                                    ? await Account.findById(
                                                          reciever
                                                      )
                                                          .select(
                                                              'transactions __v'
                                                          )
                                                          .exec()
                                                    : owner
                                            const ownerIsWorker =
                                                owner._id.toString() ===
                                                worker._id.toString()

                                            let transaction = new Transaction({
                                                from: owner._id,
                                                to: worker._id,

                                                progress: goal.name,
                                                progressId: goal._id,
                                                activity: activity.name,
                                                activityId: activity._id,
                                                status: 'pending',
                                                reward: rewardObj.reward,
                                                rewardName: rewardObject.name,
                                                rewardImages:
                                                    rewardObject.images,
                                                stage,
                                            })
                                            switch (rewardObj.repeat) {
                                                case 'once':
                                                    const progress = await Progress.findById(
                                                        goalId
                                                    )
                                                        .select('__v rewards')
                                                        .exec()

                                                    if (progress) {
                                                        progress.rewards = progress.rewards.filter(
                                                            item =>
                                                                item.rewardId !==
                                                                rewardObj.rewardId
                                                        )
                                                        await progress.save()
                                                    }
                                                    break
                                                case 'time':
                                                    break
                                                // case 'day':
                                                //     const currentStageIndex = activity.stages.findIndex(
                                                //         item =>
                                                //             item.stageId ===
                                                //             stage.stageId
                                                //     )
                                                //     if (
                                                //         currentStageIndex <
                                                //             activity.stages
                                                //                 .lenght -
                                                //                 1 &&
                                                //         stage.repeat !== 'no' &&
                                                //         !stage.old
                                                //     ) {
                                                //         const nextStage =
                                                //             activity.stages[
                                                //                 currentStageIndex +
                                                //                     1
                                                //             ]
                                                //         if (
                                                //             nextStage.repeat ===
                                                //                 stage.repeat &&
                                                //             !nextStage.old
                                                //         ) {
                                                //             const start = getStageStartEnd(
                                                //                 stage
                                                //             ).start
                                                //             const end = getStageStartEnd(
                                                //                 nextStage
                                                //             ).start
                                                //             const diffDays = end.diff(
                                                //                 start,
                                                //                 'day'
                                                //             )
                                                //             transaction.quantity = diffDays
                                                //         }
                                                //     }
                                                //     break
                                                default:
                                                    break
                                            }
                                            transaction.save()

                                            owner.transactions.unshift(
                                                transaction._id.toString()
                                            )

                                            if (!ownerIsWorker) {
                                                worker.transactions.unshift(
                                                    transaction._id.toString()
                                                )
                                            }

                                            await owner.save()
                                            if (!ownerIsWorker)
                                                await worker.save()
                                            newNotificationId = await getNotificationId()
                                            addNotification(activity, {
                                                user: reciever,
                                                code: 'get reward',
                                                notId: newNotificationId,
                                                details: {
                                                    progressId: activity._id,
                                                    progressName: activity.name,
                                                    from: rewardObj.owner,
                                                    reward: {
                                                        itemName:
                                                            rewardObject.name,
                                                    },
                                                },
                                            })
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // const rewards = activity.rewards
                    // stage.paid = rewards

                    // if (rewards.length > 0) {
                    //     for (let reward of rewards) {

                    //     }
                    // }
                }

                await activity.save()

                sendSuccess(ws)
                return
            }
        }

        ws.send(
            JSON.stringify({
                messageCode: 'errorMessage',
                messageText: 'Something failed.',
            })
        )
    } catch (ex) {
        sendError(ws)
    }
}
