const notificationService = require('./notification.service')
const { Count, System, Account } = require('../models')
const getDistributeCoinsToday = require('../utils/getDistributeCoinsToday')

const getTodayDate = () => {
    const today = new Date()
    return today.toDateString()
}

const viewsReward = async () => {
    const system = await System.System.findOne({ name: 'system' })
        .select('lastReplenishDate date')
        .lean()
        .exec()
    if (!system) {
        throw new Error()
    }

    if (
        !system.lastViewsRewardDate ||
        getTodayDate() !== system.lastViewsRewardDate
    ) {
        const counts = await Count.find({ day: { $gt: 0 } })
            .lean()
            .exec()

        if (counts.length) {
            const viewsToday = counts.reduce(
                (result, value) => result + value.day,
                0
            )

            let distributeToday = getDistributeCoinsToday(system.date)

            const price = distributeToday / viewsToday

            counts.forEach((count) => {
                const totalCoinsForCount = price * count.day

                const totalReputation = Object.keys(
                    count.reputationDestribution
                ).reduce((result, value) => {
                    const rep = count.reputationDestribution[value]
                    if (rep > 0) {
                        return result + rep
                    }
                    return result
                }, 0)

                const reputationPrice = totalCoinsForCount / totalReputation

                Object.keys(count.reputationDestribution).forEach(
                    async (userId) => {
                        const userGain =
                            reputationPrice *
                            count.reputationDestribution[userId]
                        if (userGain > 0) {
                            const newNotificationId =
                                await System.getNotificationId()

                            const result = await Account.updateOne(
                                { _id: userId },
                                {
                                    $inc: {
                                        wallet: userGain,
                                        totalEarned: userGain,
                                    },
                                    $push: {
                                        gains: {
                                            $each: [
                                                {
                                                    coins: userGain,
                                                    actionType: 'views',
                                                    questionId: count.question,
                                                    questionName:
                                                        count.questionName,
                                                },
                                            ],
                                            $slice: -100,
                                        },
                                        notifications: {
                                            $each: [
                                                {
                                                    user: userId,
                                                    code: 'coins for views',
                                                    details: {
                                                        questionId:
                                                            count.question,
                                                        questionName:
                                                            count.questionName,
                                                        coins: userGain,
                                                    },
                                                    notId: newNotificationId,
                                                },
                                            ],
                                            $slice: -50,
                                        },
                                    },
                                },
                                { useFindAndModify: false }
                            )
                            if (!result.nModified) distributeToday -= userGain
                            notificationService.notify(userId, {
                                title: 'Coins for contribution',
                                body: `Addspire has sent you ${userGain} coins for your contribution in question ${count.questionName}`,
                                data: {
                                    id: count.question,
                                    type: 'question',
                                },
                            })
                        } else distributeToday -= userGain
                    }
                )
            })

            await System.System.updateOne(
                { name: 'system' },
                {
                    $inc: { undestributedCoins: -distributeToday },
                    $set: {
                        lastViewsRewardDate: getTodayDate(),
                    },
                },
                { useFindAndModify: false }
            )

            await Count.updateMany(
                {},
                { $set: { day: 0 } },
                { useFindAndModify: false }
            )
        }
    }
}

module.exports = { viewsReward }
