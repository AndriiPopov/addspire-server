const httpStatus = require('http-status')
const { System, Account, Question, Answer, Count } = require('../models')
const ApiError = require('../utils/ApiError')

const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')

const create = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { questionId, description, images } = body

        const questionStart = await Question.findById(questionId)
            .select('club')
            .lean()
            .exec()

        if (!questionStart) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        }

        const clubId = questionStart.club

        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'create')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }
        const resource = new Answer({
            images,
            description,
            owner: accountId,
            reputation: reputationLean._id,
            question: questionId,
            club: clubId,
        })

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
            .select('followers club')
            .lean()
            .exec()
        if (!question) {
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

        const newNotificationId = await System.getNotificationId()
        if (question.followers.length)
            await Account.updateMany(
                {
                    _id: {
                        $in: question.followers.filter((i) => i !== accountId),
                    },
                },
                {
                    $push: {
                        feed: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'answered question',
                                    details: {
                                        answer: resource._id,
                                        club: question.club,
                                        questionId,
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

        const { resourceId, description, images } = body

        const resource = await Answer.findById(resourceId)
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

        const res = await Answer.updateOne(
            {
                _id: resourceId,
                ...(reputationLean.admin ? {} : { owner: accountId }),
            },
            {
                $set: {
                    description,
                    images,
                },
            },
            { useFindAndModify: false }
        )

        if (!res.nModified) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }
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

        const resource = await Answer.findById(resourceId)
            .select('club question reputation owner vote voteReputation')
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

        await Answer.deleteOne({ _id: resourceId }, { useFindAndModify: false })

        if (questionId) {
            await Count.updateOne(
                { question: questionId },
                {
                    $inc: {
                        [`reputationDestribution.${resource.owner}`]:
                            -resource.voteReputation,
                    },
                },
                { useFindAndModify: false }
            )

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