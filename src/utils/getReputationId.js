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
                    ? ' minusToday plusToday reputation admin banned club name clubName owner image'
                    : 'name'
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
            .select('name image location global')
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
            .select(
                'profiles.name profiles.image profiles.tags profiles.label profiles._id defaultProfile'
            )
            .lean()
            .exec()

        if (club && account) {
            const defaultProfile = account.profiles.find(
                (item) =>
                    item._id.toString() === account.defaultProfile.toString()
            )

            if (defaultProfile) {
                reputation.name = defaultProfile.name
                reputation.image = defaultProfile.image
                reputation.tags = defaultProfile.tags
                reputation.label = defaultProfile.label
                reputation.profile = account.defaultProfile
                reputation.clubName = club.name
                if (club.location) reputation.location = club.location
                if (club.global) reputation.global = club.global
                await reputation.save()
                return reputation
            }
        }
        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    } else return reputation
}
