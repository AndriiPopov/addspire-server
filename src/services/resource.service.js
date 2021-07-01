const httpStatus = require('http-status')
const value = require('../config/value')
const {
    System,
    Club,
    Account,
    Reputation,
    Question,
    Answer,
} = require('../models')
const ApiError = require('../utils/ApiError')

const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')
const { saveTags } = require('./tag.service')
const getModelFromType = require('../utils/getModelFromType')

const createResource = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { clubId, type, questionId, name, description, images, tags } =
            body
        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'start')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const isAnswer = type === 'answer'

        const resourceData = {
            images,
            description,
            owner: accountId,
            club: clubId,
            reputation: reputationLean._id,
            ...(isAnswer
                ? { question: questionId }
                : { name, tags, followers: [accountId], followersCount: 1 }),
        }

        const resource = isAnswer
            ? new Answer(resourceData)
            : new Question(resourceData)

        if (tags) saveTags(tags)

        const newNotificationId = await System.getNotificationId()

        let success
        let notificationData = {}
        let followers = []
        switch (type) {
            case 'question': {
                const club = await Club.findOneAndUpdate(
                    { _id: clubId },
                    { $inc: { questionsCount: 1 } },
                    { useFindAndModify: false }
                )
                    .select('followers')
                    .lean()
                    .exec()
                success = true
                notificationData = {
                    user: accountId,
                    code: 'asked question',
                    details: { question: resource._id, club: clubId },
                    notId: newNotificationId,
                }
                followers = club.followers
                break
            }
            case 'answer': {
                const question = await Question.findOneAndUpdate(
                    {
                        _id: questionId,
                        answered: { $ne: accountId },
                    },
                    {
                        $push: { answered: accountId },
                        $inc: { answersCount: 1, followersCount: 1 },
                        $addToSet: { followers: accountId },
                    },
                    { useFindAndModify: false }
                )
                    .select('followers')
                    .lean()
                    .exec()
                if (question) {
                    success = true
                }
                notificationData = {
                    user: accountId,
                    code: 'answered question',
                    details: {
                        answer: resource._id,
                        club: clubId,
                        question: questionId,
                    },
                    notId: newNotificationId,
                }
                followers = question.followers
                break
            }
            default:
                break
        }
        if (!success) {
            throw new ApiError(httpStatus.CONFLICT, 'Have answered')
        }
        await resource.save()

        await Account.updateOne(
            {
                _id: accountId,
                followingQuestions: { $ne: questionId || resource._id },
            },
            {
                $push: {
                    followingQuestions: {
                        $each: [questionId || resource._id],
                        $slice: -100,
                    },
                },
            },
            { useFindAndModify: false }
        )
        if (followers.length)
            await Account.updateMany(
                { _id: { $in: followers } },
                {
                    $push: {
                        feed: {
                            $each: [notificationData],
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

const editResource = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { resourceId, name, description, images, tags, type } = body

        const isAnswer = type === 'answer'
        const model = getModelFromType(type)
        const resource = await model
            .findById(resourceId)
            .select('club')
            .lean()
            .exec()
        if (!resource) {
            throw new ApiError(httpStatus.CONFLICT, 'No club')
        }

        const clubId = resource.club

        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'create')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const res = await model.updateOne(
            {
                _id: resourceId,
                ...(reputationLean.admin ? {} : { owner: accountId }),
            },
            {
                $set: {
                    description,
                    images,
                    ...(isAnswer ? {} : { name, tags }),
                },
            },
            { useFindAndModify: false }
        )
        saveTags(tags)

        if (!res.nModified) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const deleteResource = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { resourceId, type } = body

        const isAnswer = type === 'answer'
        const model = getModelFromType(type)
        const resource = await model
            .findById(resourceId)
            .select('club question reputation')
            .lean()
            .exec()
        if (!resource) {
            throw new ApiError(httpStatus.CONFLICT, 'No resource')
        }

        const clubId = resource.club
        const questionId = resource.question

        const reputationLean = await getReputationId(accountId, clubId, true)

        if (!reputationLean.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        await model.deleteOne(
            { _id: resourceId, club: clubId },
            { useFindAndModify: false }
        )

        if (questionId && isAnswer) {
            await Question.updateOne(
                {
                    _id: questionId,
                    club: clubId,
                },
                {
                    $pull: { answers: resourceId },
                    $inc: { answersCount: -1 },
                },
                { useFindAndModify: false }
            )
        } else {
            await Club.updateOne(
                { _id: clubId },
                {
                    $pull: {
                        questions: resourceId,
                    },
                    $inc: { questionsCount: -1 },
                },
                { useFindAndModify: false }
            )
        }
        await Reputation.updateOne(
            { _id: resource.reputation },
            {
                $pull: {
                    questions: resourceId,
                    answers: resourceId,
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

const acceptAnswer = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { answerId } = body

        const answer = await Answer.findById(answerId)
            .select('owner question club')
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
            { $set: { acceptedAnswer: answerId } },
            { useFindAndModify: false }
        )
            .select('followers')
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
                                        resourceType: 'answer',
                                        actionType: 'accepted',
                                        resourceId: answerId,
                                    },
                                ],
                                $slice: -50,
                            },
                        },
                    },
                    { useFindAndModify: false }
                )
            }
            if (question.followers.length) {
                const newNotificationId = await System.getNotificationId()

                await Account.updateMany(
                    { _id: { $in: question.followers } },
                    {
                        $push: {
                            feed: {
                                $each: [
                                    {
                                        user: accountId,
                                        code: 'accepted answer',
                                        details: {
                                            id: questionId,
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
            }
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

        const model = getModelFromType(type)

        const resource = await model
            .findById(resourceId)
            .select('club owner')
            .lean()
            .exec()

        if (!resource) {
            throw new ApiError(httpStatus.CONFLICT, 'No resource')
        }

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
            let repChange = 0
            if (type === 'question' || type === 'answer') {
                if (minus) repChange = value.minusResource
                else repChange = value.plusResource
            } else if (type === 'comment') {
                if (minus) repChange = value.minusComment
                else repChange = value.plusComment
            }

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
                                        resourceType: type,
                                        actionType: minus
                                            ? 'voteDown'
                                            : 'voteUp',
                                        resourceId,
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
                                        code: 'voted',
                                        details: {
                                            id: resourceId,
                                            resourceId,
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
    createResource,
    editResource,
    deleteResource,
    acceptAnswer,
    vote,
}
