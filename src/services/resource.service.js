const httpStatus = require('http-status')
const value = require('../config/value')
const {
    System,
    Club,
    Account,
    Reputation,
    Comment,
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
            resourceType: type,
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
        const notification = {
            $each: [
                {
                    user: accountId,
                    code:
                        // eslint-disable-next-line no-nested-ternary
                        isAnswer ? 'answered question' : 'asked question',
                    details: { id: resource._id, clubId, questionId },
                    notId: newNotificationId,
                },
            ],
            $slice: -20,
        }

        let success
        switch (type) {
            case 'question': {
                await Club.updateOne(
                    { _id: clubId },
                    {
                        $push: {
                            questions: resource._id,
                            notifications: notification,
                        },
                        $inc: { questionsCount: 1 },
                    },
                    { useFindAndModify: false }
                )
                success = true
                break
            }
            case 'answer': {
                const res = await Question.updateOne(
                    {
                        _id: questionId,
                        answered: { $ne: accountId },
                    },
                    {
                        $push: {
                            answers: resource._id,
                            answered: accountId,
                            notifications: notification,
                        },
                        $inc: { answersCount: 1, followersCount: 1 },
                        $addToSet: { followers: accountId },
                    },
                    { useFindAndModify: false }
                )
                if (res.nModified) {
                    success = true
                }

                break
            }
            default:
                break
        }
        if (!success) {
            throw new ApiError(httpStatus.CONFLICT, 'Have answered')
        }
        await resource.save()
        await Reputation.updateOne(
            { _id: reputationLean._id },
            {
                $push: {
                    [isAnswer ? 'answers' : 'questions']: resource._id,
                    notifications: notification,
                },
            },
            { useFindAndModify: false }
        )
        await Account.updateOne(
            { _id: accountId },
            { $addToSet: { followingQuestions: questionId || resource._id } },
            { useFindAndModify: false }
        )
        return { success: true }
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
        return { success: true }
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

        return { success: true }
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

        const newNotificationId = await System.getNotificationId()
        const notification = {
            $each: [
                {
                    user: accountId,
                    code: 'accepted answer',
                    details: { id: questionId, answerId, clubId },
                    notId: newNotificationId,
                },
            ],
            $slice: -20,
        }

        const result = await Question.updateOne(
            {
                _id: questionId,
                owner: accountId,
                acceptedAnswer: 'no',
            },
            {
                $set: { acceptedAnswer: answerId },
                $push: { notifications: notification },
            },
            { useFindAndModify: false }
        )

        if (result.nModified) {
            const reputationLean = await getReputationId(answer.owner, clubId)

            await Reputation.updateOne(
                { _id: reputationLean._id },
                { $inc: { reputation: value.acceptedAnswer } },
                {
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
            return { success: true }
        }
        throw new ApiError(httpStatus.CONFLICT, 'Already accepted')
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

        const newNotificationId = await System.getNotificationId()
        const notification = {
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
            $slice: 5,
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
                    notifications: notification,
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
            if (type === 'resource') {
                if (minus) repChange = value.minusResource
                else repChange = value.plusResource
            } else if (type === 'comment') {
                if (minus) repChange = value.minusComment
                else repChange = value.plusComment
            }
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
                                    actionType: minus ? 'voteDown' : 'voteUp',
                                    resourceId,
                                },
                            ],
                            $slice: -50,
                        },
                    },
                },
                { useFindAndModify: false }
            )
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
