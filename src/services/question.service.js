const httpStatus = require('http-status')
const { System, Club, Account, Question, Count } = require('../models')
const ApiError = require('../utils/ApiError')

const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')
const { saveTags } = require('./tag.service')

const create = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { clubId, name, description, images, tags, bonusCoins } = body
        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'start')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const realCoinsBonusTotal = bonusCoins
            ? Math.min(account.wallet, bonusCoins)
            : 0
        const realCoinsBonus = realCoinsBonusTotal * 0.95
        const addspireCommission = realCoinsBonusTotal - realCoinsBonus

        const bonusPending = !!realCoinsBonus
        const resource = new Question({
            images,
            description,
            owner: accountId,
            club: clubId,
            reputation: reputationLean._id,
            name,
            tags,
            followers: [accountId],
            followersCount: 1,
            bonusCoins: realCoinsBonus,
            bonusPending,
            ...(bonusPending ? { bonusCreatedDate: Date.now() } : {}),
        })
        if (tags) saveTags(tags)

        const count = new Count({
            question: resource._id,
            questionName: name,
        })
        await count.save()
        resource.count = count._id

        await resource.save()

        const newNotificationId = await System.getNotificationId()

        const club = await Club.findOneAndUpdate(
            { _id: clubId },
            { $inc: { questionsCount: 1 } },
            { useFindAndModify: false }
        )
            .select('followers')
            .lean()
            .exec()

        await Account.updateOne(
            { _id: accountId },
            {
                $push: {
                    followingQuestions: {
                        $each: [resource._id],
                        $slice: -100,
                    },
                },
                $inc: { wallet: -realCoinsBonusTotal },
            },
            { useFindAndModify: false }
        )

        if (addspireCommission)
            await System.System.updateOne(
                { name: 'system' },
                { $inc: { myCoins: addspireCommission } },
                { useFindAndModify: false }
            )

        if (club.followers.length)
            await Account.updateMany(
                { _id: { $in: club.followers.filter((i) => i !== accountId) } },
                {
                    $push: {
                        feed: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'asked question',
                                    details: {
                                        questionId: resource._id,
                                        club: clubId,
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
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const edit = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { resourceId, name, description, images, tags, bonusCoins } = body

        const resource = await Question.findById(resourceId)
            .select('club bonusPending bonusPaid')
            .lean()
            .exec()
        if (!resource) {
            throw new ApiError(httpStatus.CONFLICT, 'No club')
        }

        await Count.updateOne(
            { question: resourceId },
            { $set: { questionName: name } },
            { useFindAndModify: false }
        )

        const clubId = resource.club

        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'create')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        let bonusPending = false
        let realCoinsBonus = 0
        let addspireCommission = 0
        let realCoinsBonusTotal = 0
        if (!resource.bonusPaid) {
            realCoinsBonusTotal = bonusCoins
                ? Math.min(account.wallet, bonusCoins)
                : 0
            realCoinsBonus = realCoinsBonusTotal * 0.95
            addspireCommission = realCoinsBonusTotal - realCoinsBonus

            if (!resource.bonusPending) {
                bonusPending = !!realCoinsBonus
            }
        }

        const res = await Question.updateOne(
            {
                _id: resourceId,
                ...(reputationLean.admin ? {} : { owner: accountId }),
            },
            {
                $set: {
                    description,
                    images,
                    name,
                    tags,
                    ...(bonusPending
                        ? { bonusPending: true, bonusCreatedDate: Date.now() }
                        : {}),
                },
                $inc: {
                    bonusCoins: realCoinsBonus,
                },
            },
            { useFindAndModify: false }
        )
        saveTags(tags)

        if (!res.nModified) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        if (realCoinsBonus)
            await Account.updateOne(
                { _id: accountId },
                { $inc: { wallet: -realCoinsBonusTotal } },
                { useFindAndModify: false }
            )

        if (addspireCommission)
            await System.System.updateOne(
                { name: 'system' },
                { $inc: { myCoins: addspireCommission } },
                { useFindAndModify: false }
            )
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const remove = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { resourceId } = body

        const resource = await Question.findById(resourceId)
            .select(
                'club reputation owner vote bonusCoins bonusPending bonusPaid'
            )
            .lean()
            .exec()
        if (!resource) {
            throw new ApiError(httpStatus.CONFLICT, 'No resource')
        }

        const clubId = resource.club

        const reputationLean = await getReputationId(accountId, clubId, true)

        if (!reputationLean.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        await Question.deleteOne(
            { _id: resourceId },
            { useFindAndModify: false }
        )

        await Count.deleteOne(
            { question: resourceId },
            { useFindAndModify: false }
        )

        await Club.updateOne(
            { _id: clubId },
            { $inc: { questionsCount: -1 } },
            { useFindAndModify: false }
        )

        if (resource.bonusPending && !resource.bonusPaid) {
            const newNotificationId = await System.getNotificationId()
            const result = await Account.updateOne(
                { _id: resource.owner },
                {
                    $inc: { wallet: resource.bonusCoins },
                    $push: {
                        gains: {
                            $each: [
                                {
                                    coins: resource.bonusCoins,
                                    actionType: 'return bonus',
                                    questionId: resource._id,
                                    questionName: resource.name,
                                    user: resource.owner,
                                },
                            ],
                            $slice: -100,
                        },
                        notifications: {
                            $each: [
                                {
                                    user: resource.owner,
                                    code: 'return bonus',
                                    details: {
                                        questionId: resource._id,
                                        questionName: resource.name,
                                        coins: resource.bonusCoins,
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
                    { $inc: { myCoins: resource.bonusCoins } },
                    { useFindAndModify: false }
                )
            }
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

module.exports = {
    create,
    edit,
    remove,
}
