const dayjs = require('dayjs')
const mongoose = require('mongoose')
const schedule = require('node-schedule')
const config = require('./config/config')

const { System, Count, Account } = require('./models')

const getTodayDate = () => {
    const today = new Date()
    return today.toDateString()
}

const viewsReward = async () => {
    const system = await System.System.findOne({ name: 'system' })
        .select('lastViewsRewardDate date')
        .lean()
        .exec()
    if (!system) setTimeout(viewsReward, 30000)

    if (
        !system.lastViewsRewardDate ||
        getTodayDate() !== system.lastViewsRewardDate
    ) {
        await mongoose.connect(config.mongoose.url, config.mongoose.options)

        const counts = await Count.find({ day: { $gt: 0 } })
            .lean()
            .exec()

        const viewsToday = counts.reduce((result, value) => result + value, 0)

        if (counts.length) {
            const dayCoef = dayjs().diff(dayjs(system.date), 'day') / 365

            let distributeToday = 80000 * (1 / dayCoef ** 6 - 2)

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
                                    $inc: { wallet: userGain },
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

        await mongoose.connection.close()
    }
}

viewsReward()

// Schedule replenish of reputation, minusToday and plusToday
schedule.scheduleJob('0 * * *', viewsReward)
