const httpStatus = require('http-status')
const { Account, Club, Reputation, System } = require('../models')
const ApiError = require('../utils/ApiError')

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createClub = async (req) => {
    const { account, body } = req
    const { _id: accountId } = account

    const reputation = new Reputation({
        user: accountId,
        admin: true,
    })

    const club = new Club({
        admins: [accountId],
        reputations: [reputation._id],
        followers: [accountId],
        name: body.name,
        image: body.image,
        description: body.description,
    })

    reputation.club = club._id
    await club.save()
    await reputation.save()
    const newNotificationId = await System.getNotificationId()

    await Account.updateOne(
        { _id: accountId },
        {
            $push: {
                admin: club._id,
                followingClubs: club._id,
                reputations: reputation._id,
                notifications: {
                    $each: [
                        {
                            user: accountId,
                            code: 'create new club',
                            details: {
                                id: club._id,
                            },
                            notId: newNotificationId,
                        },
                    ],
                    $slice: 5,
                },
            },
            $inc: { reputationsCount: 1 },
        },
        { useFindAndModify: false }
    )
    return club
}

module.exports = {
    createClub,
}
