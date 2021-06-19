const { Reputation } = require('../models')

const unban = () => {
    Reputation.updateMany(
        { reputation: { $lt: 0, $gt: -6 } },
        {
            $set: {
                reputation: 0,
            },
        },
        { useFindAndModify: false }
    )
    setTimeout(
        () =>
            Reputation.updateMany(
                { reputation: { $lt: -5 } },
                {
                    $inc: {
                        reputation: 5,
                    },
                },
                { useFindAndModify: false }
            ),
        300000
    )
}
module.exports = () => {
    Reputation.updateMany(
        {},
        {
            $set: {
                plusToday: 0,
                minusToday: 0,
            },
        },
        { useFindAndModify: false }
    )

    setTimeout(unban, 300000)
}
