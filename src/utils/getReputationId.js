const httpStatus = require('http-status')
const { Club, Reputation, Account } = require('../models')
const ApiError = require('./ApiError')

module.exports = async (accountId, clubId, withData) => {
    let reputation = await Reputation.findOne({
        owner: accountId,
        club: clubId,
    })
        .select(
            `_id${
                withData
                    ? ' minusToday plusToday reputation admin banned club name clubName clubImage owner image'
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

        const club = await Club.findOneAndUpdate(
            { _id: clubId },
            { $inc: { reputationsCount: 1 } },
            { useFindAndModify: false }
        )
            .select('name image')
            .lean()
            .exec()

        const account = await Account.findOneAndUpdate(
            { _id: accountId },
            {
                $push: {
                    reputations: {
                        club: clubId,
                        reputation: reputation._id,
                    },
                },
                $inc: { reputationsCount: 1 },
            },
            { useFindAndModify: false }
        )
            .select('name image tags')
            .lean()
            .exec()
        if (club && account) {
            reputation.name = account.name
            reputation.image = account.image
            reputation.tags = account.tags
            reputation.profileTags = account.tags
            reputation.clubName = club.name
            reputation.clubImage = club.image
            await reputation.save()
            return reputation
        }
        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    } else return reputation
}
