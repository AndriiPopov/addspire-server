const { Count, Account, System, Question } = require('../models')
const ApiError = require('./ApiError')

module.exports = async (question) => {
    try {
        if (!question.bonusPaid && question.bonusPending) {
            const count = await Count.findById(question.count).lean().exec()
            if (count) {
                const distributionCoins = {}
                let returnCoins = 0

                let coinsLeft = question.bonusCoins
                // Accepted
                if (
                    question.acceptedAnswer !== 'no' &&
                    question.acceptedAnswerOwner
                ) {
                    const coinsForAccepted = 0.5 * coinsLeft
                    coinsLeft -= coinsForAccepted
                    if (coinsForAccepted) {
                        distributionCoins[question.acceptedAnswerOwner] =
                            coinsForAccepted
                    }
                }
                // Contribution
                const totalReputation = Object.keys(
                    count.reputationDestribution
                ).reduce((result, id) => {
                    const rep = count.reputationDestribution[id]
                    if (rep > 0) {
                        return result + rep
                    }
                    return result
                }, 0)
                if (totalReputation) {
                    const priceCoins = coinsLeft / totalReputation
                    Object.keys(count.reputationDestribution).forEach(
                        (userId) => {
                            const coins =
                                count.reputationDestribution[userId] *
                                priceCoins

                            if (coins) {
                                distributionCoins[userId] =
                                    (distributionCoins[userId] || 0) + coins
                            }
                        }
                    )
                }
                // Distribute coins
                await Promise.all(
                    Object.keys(distributionCoins).map(async (userId) => {
                        const newNotificationId =
                            await System.getNotificationId()
                        const result = await Account.updateOne(
                            { _id: userId },
                            {
                                $inc: {
                                    wallet: distributionCoins[userId],
                                    totalEarned: distributionCoins[userId],
                                },
                                $push: {
                                    gains: {
                                        $each: [
                                            {
                                                coins: distributionCoins[
                                                    userId
                                                ],
                                                actionType: 'bonus',
                                                questionId: count.question,
                                                questionName:
                                                    count.questionName,
                                                user: question.owner,
                                            },
                                        ],
                                        $slice: -100,
                                    },
                                    notifications: {
                                        $each: [
                                            {
                                                user: question.owner,
                                                code: 'bonus coins for contribution',
                                                details: {
                                                    questionId: count.question,
                                                    questionName:
                                                        count.questionName,
                                                    coins: distributionCoins[
                                                        userId
                                                    ],
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
                        if (!result.nModified)
                            returnCoins += distributionCoins[userId]
                    })
                )
                if (returnCoins) {
                    const newNotificationId = await System.getNotificationId()
                    const result = await Account.updateOne(
                        { _id: question.owner },
                        {
                            $inc: {
                                wallet: returnCoins,
                                totalSpent: -returnCoins,
                            },
                            $push: {
                                gains: {
                                    $each: [
                                        {
                                            coins: returnCoins,
                                            actionType: 'return bonus',
                                            questionId: count.question,
                                            questionName: count.questionName,
                                            user: question.owner,
                                        },
                                    ],
                                    $slice: -100,
                                },
                                notifications: {
                                    $each: [
                                        {
                                            user: question.owner,
                                            code: 'return bonus',
                                            details: {
                                                questionId: count.question,
                                                questionName:
                                                    count.questionName,
                                                coins: returnCoins,
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
                    if (!result.nModified) {
                        await System.System.updateOne(
                            { name: 'system' },
                            { $inc: { myCoins: returnCoins } },
                            { useFindAndModify: false }
                        )
                    }
                }
            }
            await Question.updateOne(
                { _id: question._id },
                { $set: { bonusPending: false, bonusPaid: true } },
                { useFindAndModify: false }
            )
        }
    } catch (error) {
        throw new Error()
    }
}
