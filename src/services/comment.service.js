const httpStatus = require('http-status')

const {
    Account,
    Reputation,
    System,
    Comment,
    Question,
    Club,
} = require('../models')
const ApiError = require('../utils/ApiError')
const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')
const getModelFromType = require('../utils/getModelFromType')

const createComment = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { text, resourceId, resourceType } = body

        const model = getModelFromType(resourceType)
        const isQuestion = resourceType === 'question'

        const resource = await model
            .findById(resourceId)
            .select(`club${isQuestion ? '' : ' question'}`)
            .lean()
            .exec()

        if (!resource) {
            throw new ApiError(
                httpStatus.CONFLICT,
                'Converstion does not exist'
            )
        }
        const clubId = resource.club
        const questionId = isQuestion ? resourceId : resource.question

        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'create')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const comment = new Comment({
            owner: accountId,
            text,
            club: clubId,
            resource: resourceId,
            resourceType,
            reputation: reputationLean._id,
        })

        await comment.save()

        await Account.updateOne(
            { _id: accountId },
            {
                $push: {
                    followingQuestions: { $each: [questionId], $slice: -100 },
                },
            },
            { useFindAndModify: false }
        )
        let followers = []
        if (isQuestion) {
            const question = await model
                .findOneAndUpdate(
                    { _id: resourceId },
                    {
                        $push: {
                            comments: comment._id,
                            followers: accountId,
                        },
                        $inc: {
                            followersCount: isQuestion ? 1 : 0,
                            commentsCount: 1,
                        },
                    },
                    { useFindAndModify: false }
                )
                .select('followers')
                .lean()
                .exec()
            followers = question?.followers
        } else {
            await model.updateOne(
                { _id: resourceId },
                {
                    $push: {
                        comments: comment._id,
                    },
                    $inc: {
                        commentsCount: 1,
                    },
                },
                { useFindAndModify: false }
            )
            const question = await Question.findOneAndUpdate(
                { _id: questionId },
                {
                    $push: {
                        followers: accountId,
                    },
                    $inc: { followersCount: 1 },
                },
                { useFindAndModify: false }
            )
                .select('followers')
                .lean()
                .exec()
            followers = question?.followers
        }

        if (followers.length) {
            const newNotificationId = await System.getNotificationId()

            await Account.updateOne(
                { _id: followers },
                {
                    $push: {
                        feed: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'commented',
                                    details: {
                                        id: comment._id,
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

        return { success: true }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const editComment = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { text, commentId } = body

        const comment = await Comment.findById(commentId)
            .select('club')
            .lean()
            .exec()

        if (!comment) {
            throw new ApiError(
                httpStatus.CONFLICT,
                'Converstion does not exist'
            )
        }

        const clubId = comment.club

        const reputationLean = await getReputationId(accountId, clubId, true)

        const rights = await checkVote(reputationLean, 'create')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const res = await Comment.updateOne(
            {
                _id: commentId,
                ...(reputationLean.admin ? {} : { owner: accountId }),
            },
            { $set: { text } },
            { useFindAndModify: false }
        )
        if (res.nModified) {
            return { success: true }
        }
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const deleteComment = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { commentId } = body
        const comment = await Comment.findById(commentId)
            .select('club resource resourceType')
            .lean()
            .exec()

        if (!comment) {
            throw new ApiError(
                httpStatus.CONFLICT,
                'Converstion does not exist'
            )
        }

        const clubId = comment.club
        const resourceId = comment.resource
        const { resourceType } = comment

        const model = getModelFromType(resourceType)

        const reputationLean = await getReputationId(accountId, clubId, true)
        const res = await Comment.deleteOne(
            {
                _id: commentId,
                ...(reputationLean.admin ? {} : { owner: accountId }),
            },
            { useFindAndModify: false }
        )

        if (res.deletedCount) {
            await model.updateOne(
                { _id: resourceId },
                {
                    $pull: { comments: commentId },
                    $inc: { commentsCount: -1 },
                },
                { useFindAndModify: false }
            )
            return { success: true }
        }
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

module.exports = {
    createComment,
    editComment,
    deleteComment,
}
