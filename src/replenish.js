const mongoose = require('mongoose')
const schedule = require('node-schedule')
const config = require('./config/config')

const { Reputation, System, Account } = require('./models')

const getTodayDate = () => {
    const today = new Date()
    return today.toDateString()
}

const replenish = async () => {
    const system = await System.System.findOne({ name: 'system' })
        .select('lastReplenishDate')
        .lean()
        .exec()
    if (!system) {
        setTimeout(replenish, 30000)
        return
    }

    if (
        !system.lastReplenishDate ||
        getTodayDate() !== system.lastReplenishDate
    ) {
        await mongoose.connect(config.mongoose.url, config.mongoose.options)
        await Reputation.updateMany(
            {},
            [
                {
                    $set: {
                        plusToday: 0,
                        minusToday: 0,
                        reputationHistory: {
                            $concatArrays: [
                                '$reputationHistory',
                                [{ reputation: '$reputation' }],
                            ],
                        },
                    },
                },
            ],
            { useFindAndModify: false }
        )

        await Reputation.updateMany(
            { reputation: { $lt: 0, $gt: -6 } },
            {
                $set: {
                    reputation: 0,
                },
            },
            { useFindAndModify: false }
        )

        await Reputation.updateMany(
            { reputation: { $lt: -5 } },
            {
                $inc: {
                    reputation: 5,
                },
            },
            { useFindAndModify: false }
        )

        await Account.updateMany(
            {},
            [
                {
                    $set: {
                        walletHistory: {
                            $concatArrays: [
                                '$walletHistory',
                                [{ coins: '$wallet' }],
                            ],
                        },
                    },
                },
            ],
            { useFindAndModify: false }
        )

        await System.System.updateOne(
            { name: 'system' },
            {
                $set: {
                    lastReplenishDate: getTodayDate(),
                },
            },
            { useFindAndModify: false }
        )
        await mongoose.connection.close()
    }
}

replenish()

// Schedule replenish of reputation, minusToday and plusToday
schedule.scheduleJob('2 * * *', replenish)
