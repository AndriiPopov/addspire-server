const notificationService = require('./notification.service')
const { Reputation, System, Account, Club } = require('../models')

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
        throw new Error()
    }

    if (
        !system.lastReplenishDate ||
        getTodayDate() !== system.lastReplenishDate
    ) {
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

        const reputations = await Reputation.find({
            reputation: { $lt: 0, $gt: -6 },
        })
            .select('clubName club owner')
            .lean()
            .exec()

        reputations.forEach((rep) => {
            notificationService.notify(rep.owner, {
                key: 'reputationReplenished',
                body: { clubName: rep.clubName },
                data: {
                    id: rep.club,
                    type: 'club',
                },
            })
        })

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

        await System.System.updateOne(
            { name: 'system' },
            {
                $set: {
                    lastReplenishDate: getTodayDate(),
                },
            },
            { useFindAndModify: false }
        )
    }
}

module.exports = { replenish }
