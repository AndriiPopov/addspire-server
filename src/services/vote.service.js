const httpStatus = require('http-status')
const value = require('../config/value')
const {
    System,
    Account,
    Reputation,
    Question,
    Answer,
    Count,
} = require('../models')
const ApiError = require('../utils/ApiError')

const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')
const getModelFromType = require('../utils/getModelFromType')
const distributeBonus = require('../utils/distributeBonus')
const notificationService = require('./notification.service')

const acceptAnswer = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { answerId } = body

        const answer = await Answer.findById(answerId)
            .select('owner question club reputation')
            .lean()
            .exec()

        if (!answer) {
            throw new ApiError(httpStatus.CONFLICT, 'No answer')
        }

        const questionId = answer.question
        const clubId = answer.club

        const question = await Question.findOneAndUpdate(
            {
                _id: questionId,
                owner: accountId,
                acceptedAnswer: 'no',
            },
            {
                $set: {
                    acceptedAnswer: answerId,
                    acceptedAnswerOwner: answer.owner,
                },
            },
            { new: true, useFindAndModify: false }
        )
            .select(
                'followers name bonusPaid bonusPending bonusCoins count acceptedAnswerOwner'
            )
            .lean()
            .exec()
        if (question) {
            const reputationLean = await getReputationId(answer.owner, clubId)
            if (answer.owner !== accountId) {
                await Reputation.updateOne(
                    { _id: reputationLean._id },
                    {
                        $inc: { reputation: value.acceptedAnswer },
                        $push: {
                            gains: {
                                $each: [
                                    {
                                        reputation: value.acceptedAnswer,
                                        gainType: 'answer',
                                        actionType: 'accepted',
                                        questionId,
                                        questionName: question.name,
                                    },
                                ],
                                $slice: -50,
                            },
                        },
                    },
                    { useFindAndModify: false }
                )

                await Count.updateOne(
                    { question: question._id },
                    {
                        $inc: {
                            [`reputationDestribution.${answer.owner}`]:
                                value.acceptedAnswer,
                        },
                    },
                    { useFindAndModify: false }
                )

                await Answer.updateOne(
                    { _id: answerId },
                    { $inc: { voteReputation: value.acceptedAnswer } },
                    { useFindAndModify: false }
                )
            }

            if (question.followers.length) {
                const newNotificationId = await System.getNotificationId()
                const notifiedAccounts = question.followers.filter(
                    (i) => i !== accountId
                )
                await Account.updateMany(
                    {
                        _id: {
                            $in: notifiedAccounts,
                        },
                    },
                    {
                        $push: {
                            feed: {
                                $each: [
                                    {
                                        user: accountId,
                                        code: 'accepted answer',
                                        details: {
                                            questionId,
                                            answerId,
                                            clubId,
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
                    title: 'Accepted answer',
                    body: `An answer is accepted in question ${question.name}`,
                    data: {
                        id: question._id,
                        type: 'question',
                    },
                })
            }

            await distributeBonus(question)
        } else throw new ApiError(httpStatus.CONFLICT, 'Already accepted')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const vote = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { resourceId, type, minus } = body

        let repChange = 0
        if (type === 'question' || type === 'answer') {
            if (minus) repChange = value.minusResource
            else repChange = value.plusResource
        } else if (type === 'comment') {
            if (minus) repChange = value.minusComment
            else repChange = value.plusComment
        }

        const model = getModelFromType(type)

        const resource = await model
            .findById(resourceId)
            .select('club owner question text reputation')
            .lean()
            .exec()

        if (!resource) {
            throw new ApiError(httpStatus.CONFLICT, 'No resource')
        }

        const question = await Question.findById(
            resource.question || resource._id
        )
            .select('name')
            .lean()
            .exec()

        const clubId = resource.club

        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, minus ? 'minus' : 'plus')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const res = await model.updateOne(
            {
                _id: resourceId,
                votesUp: { $ne: accountId },
                votesDown: { $ne: accountId },
                owner: { $ne: accountId },
            },
            {
                $push: {
                    [minus ? 'votesDown' : 'votesUp']: accountId,
                },
                $inc: {
                    [minus ? 'votesDownCount' : 'votesUpCount']: 1,
                    vote: minus ? -1 : 1,
                    voteReputation: repChange,
                },
            },
            { useFindAndModify: false }
        )

        if (res.nModified) {
            await Reputation.updateOne(
                { _id: reputationLean._id },
                { $inc: { [minus ? 'minusToday' : 'plusToday']: 1 } },
                { useFindAndModify: false }
            )

            const reputationLeanReciever = await getReputationId(
                resource.owner,
                clubId
            )

            if (resource.owner !== accountId) {
                await Reputation.updateOne(
                    { _id: reputationLeanReciever._id },
                    {
                        $inc: { reputation: repChange },
                        $push: {
                            gains: {
                                $each: [
                                    {
                                        reputation: repChange,
                                        gainType: type,
                                        actionType: minus
                                            ? 'voteDown'
                                            : 'voteUp',
                                        questionId: question._id,
                                        questionName: question.name,
                                        ...(type === 'comment'
                                            ? { comment: resource.text }
                                            : {}),
                                    },
                                ],
                                $slice: -50,
                            },
                        },
                    },
                    { useFindAndModify: false }
                )

                await Count.updateOne(
                    { question: question._id },
                    {
                        $inc: {
                            [`reputationDestribution.${resource.owner}`]:
                                repChange,
                        },
                    },
                    { useFindAndModify: false }
                )

                const newNotificationId = await System.getNotificationId()
                await Account.updateOne(
                    { _id: resource.owner },
                    {
                        $push: {
                            feed: {
                                $each: [
                                    {
                                        code: minus ? 'voteDown' : 'voteUp',
                                        details: {
                                            id: resourceId,
                                            questionId: question._id,
                                            type,
                                            minus,
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
                notificationService.notify(resource.owner, {
                    title: minus ? 'Vote down' : 'Vote up',
                    body: `For your contribution in ${question.name}`,
                    data: {
                        id: question._id,
                        type: 'question',
                    },
                })
            }
        } else {
            throw new ApiError(httpStatus.CONFLICT, 'Already voted')
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}
module.exports = {
    acceptAnswer,
    vote,
}
