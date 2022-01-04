const httpStatus = require('http-status')
const notificationService = require('./notification.service')
const {
    System,
    Club,
    Account,
    Question,
    Count,
    Answer,
    Reputation,
} = require('../models')
const ApiError = require('../utils/ApiError')

const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')
const { saveTags } = require('./tag.service')

const create = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const {
            clubId,
            name,
            description,
            images,
            tags,
            bonusCoins,
            bookmark,
        } = body
        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'start')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const realCoinsBonusTotal = bonusCoins
            ? Math.min(account.wallet, bonusCoins)
            : 0
        const realCoinsBonus = realCoinsBonusTotal
        // const realCoinsBonus = realCoinsBonusTotal * 0.95
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
            bonusCoins: realCoinsBonus,
            bonusPending,
            ...(bonusPending ? { bonusCreatedDate: Date.now() } : {}),
        })
        if (bookmark) {
            resource.followers = [accountId]
            resource.followersCount = 1
        }
        if (tags) saveTags(tags)

        const count = new Count({
            question: resource._id,
            questionName: name,
        })
        await count.save()
        resource.count = count._id

        const newNotificationId = await System.getNotificationId()

        const club = await Club.findOneAndUpdate(
            { _id: clubId },
            {
                $inc: { questionsCount: 1 },
                ...(images.length
                    ? { $push: { images: { $each: [images[0]], $slice: -20 } } }
                    : {}),
            },
            { useFindAndModify: false }
        )
            .select('followers global location clubAddress')
            .lean()
            .exec()

        if (!club) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        }

        if (club.location) resource.location = club.location
        if (club.clubAddress) resource.clubAddress = club.clubAddress
        if (club.global) resource.global = club.global

        await resource.save()

        await Account.updateOne(
            { _id: accountId },
            {
                ...(bookmark
                    ? {
                          $push: {
                              followingQuestions: {
                                  $each: [resource._id],
                                  $slice: -200,
                              },
                          },
                      }
                    : {}),
                $inc: {
                    wallet: -realCoinsBonusTotal,
                    totalSpent: realCoinsBonusTotal,
                },
            },
            { useFindAndModify: false }
        )

        if (addspireCommission)
            await System.System.updateOne(
                { name: 'system' },
                { $inc: { myCoins: addspireCommission } },
                { useFindAndModify: false }
            )

        if (club.followers.length) {
            const notifiedAccounts = club.followers.filter(
                (i) => i.toString() !== accountId.toString()
            )
            await Account.updateMany(
                { _id: { $in: notifiedAccounts } },
                {
                    $push: {
                        feed: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'asked question',
                                    questionId: resource._id,
                                    details: {
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
            notificationService.notify(notifiedAccounts, {
                key: 'newQuestion',
                body: {
                    clubName: reputationLean.clubName,
                    name: reputationLean.name,
                    question: resource.name,
                },
                data: {
                    id: resource._id,
                    type: 'question',
                },
            })
        }

        await Reputation.updateOne(
            { _id: reputationLean._id },
            {
                $inc: { questionsCount: 1 },
                $set: {
                    lastContent: {
                        resourceId: resource._id,
                        resourceType: 'question',
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
            // realCoinsBonus = realCoinsBonusTotal * 0.95
            realCoinsBonus = realCoinsBonusTotal
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
                {
                    $inc: {
                        wallet: -realCoinsBonusTotal,
                        totalSpent: realCoinsBonusTotal,
                    },
                },
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
                'club reputation owner vote bonusCoins bonusPending bonusPaid images'
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
                    $inc: {
                        wallet: resource.bonusCoins,
                        totalSpent: -resource.bonusCoins,
                    },
                    $push: {
                        gains: {
                            $each: [
                                {
                                    coins: resource.bonusCoins,
                                    actionType: 'return',
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
                                        image: resource.images.length
                                            ? resource.images[0]
                                            : reputationLean.image,
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

const saveBestAnswer = async (questionId) => {
    const answers = await Answer.find({ question: questionId })
        .sort({ vote: -1 })
        .limit(1)
        .select('_id')
        .exec()

    if (answers && answers.length) {
        const answer = answers[0]
        if (answer) {
            const answerId = answer._id
            if (answerId) {
                await Question.updateOne(
                    { _id: questionId },
                    { $set: { bestAnswer: answerId } },
                    { useFindAndModify: false }
                )
            }
        }
    }
}

module.exports = {
    create,
    edit,
    remove,
    saveBestAnswer,
}
