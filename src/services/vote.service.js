const httpStatus = require('http-status')
const value = require('../config/value')
const { System, Account, Reputation, Question, Answer } = require('../models')
const ApiError = require('../utils/ApiError')

const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')
const getModelFromType = require('../utils/getModelFromType')
const notificationService = require('./notification.service')
const { questionService } = require('.')

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
            .select('owner followers name acceptedAnswerOwner')
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

                await Answer.updateOne(
                    { _id: answerId },
                    { $inc: { voteReputation: value.acceptedAnswer } },
                    { useFindAndModify: false }
                )
            }

            if (question.followers.length) {
                const newNotificationId = await System.getNotificationId()
                const notifiedAccounts = question.followers.filter(
                    (i) => i.toString() !== accountId.toString()
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
                                        questionId,
                                        details: {
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
                const reputationLeanQuestion = await getReputationId(
                    question.owner,
                    clubId
                )
                notificationService.notify(notifiedAccounts, {
                    key: 'acceptedAnswer',
                    body: {
                        question: question.name,
                        name: reputationLeanQuestion
                            ? reputationLeanQuestion.name
                            : 'The author',
                    },

                    data: {
                        id: question._id,
                        type: 'question',
                    },
                })
            }
        } else throw new ApiError(httpStatus.CONFLICT, 'Already accepted')
    } catch (error) {
        if (!error.isOperational) {
            console.log(error)
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
        } else if (minus) repChange = value.minusComment
        else repChange = value.plusComment

        const model = getModelFromType(type)

        const resource = await model
            .findById(resourceId)
            .select('club owner question text reputation post')
            .lean()
            .exec()

        if (!resource) {
            throw new ApiError(httpStatus.CONFLICT, 'No resource')
        }

        const question = await Question.findById(
            resource.question || resource._id
        )
            .select('name post')
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

            if (resource.owner !== accountId) {
                const reputationLeanReciever = await getReputationId(
                    resource.owner,
                    clubId
                )
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
                                        details: { post: question.post },
                                    },
                                ],
                                $slice: -50,
                            },
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
                                        questionId: question._id,
                                        details: {
                                            id: resourceId,
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
                    key: minus ? 'voteDown' : 'voteUp',
                    body: {
                        question: question.name,
                        rep: repChange,
                    },
                    data: {
                        id: question._id,
                        type: 'question',
                    },
                })
            }
            if (type === 'answer') {
                await questionService.saveBestAnswer(question._id)
            }
            if (type === 'comment' && question.post) {
                await questionService.saveBestComment(question._id)
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
