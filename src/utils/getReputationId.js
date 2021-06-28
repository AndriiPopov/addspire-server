const { Club, Reputation, Account } = require('../models')

module.exports = async (accountId, clubId, withData) => {
    let reputation = await Reputation.findOne({
        owner: accountId,
        club: clubId,
    })
        .select(
            `_id${
                withData
                    ? ' plusToday minusToday reputation admin banned club'
                    : ''
            }`
        )
        .lean()
        .exec()
    if (!reputation) {
        reputation = new Reputation({
            owner: accountId,
            club: clubId,
        })
        await reputation.save()

        await Club.updateOne(
            { _id: clubId },
            {
                $push: {
                    reputations: {
                        reputationId: reputation._id,
                        accountId,
                    },
                },
                $inc: { reputationsCount: 1 },
            },
            { useFindAndModify: false }
        )

        await Account.updateOne(
            { _id: accountId },
            {
                $push: {
                    reputations: {
                        clubId,
                        reputationId: reputation._id,
                    },
                },
                $inc: { reputationsCount: 1 },
            },
            { useFindAndModify: false }
        )
    }
    return reputation
}
