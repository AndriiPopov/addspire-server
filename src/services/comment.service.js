const httpStatus = require('http-status')

const {
    Account,

    Reputation,
    System,
    Comment,
    Resource,
} = require('../models')
const ApiError = require('../utils/ApiError')
const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')

const createComment = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { text, resourceId } = body

        const resource = await Resource.findById(resourceId)
            .select('club question')
            .lean()
            .exec()

        if (!resource) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Not created')
        }

        const clubId = resource.club
        const questionId = resource.question || resourceId

        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'create')
        if (!rights) {
            throw new ApiError(httpStatus.CONFLICT, 'Not enough rights')
        }

        const comment = new Comment({
            owner: accountId,
            text,
            club: clubId,
            resource: resourceId,
        })

        await comment.save()

        const newNotificationId = await System.getNotificationId()

        await Account.updateOne(
            { _id: accountId },
            {
                $push: {
                    followingResources: questionId,
                    notifications: {
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
                        $slice: 5,
                    },
                },
            },
            { useFindAndModify: false }
        )
        await Reputation.updateOne(
            { _id: reputationLean._id },
            { $push: { comments: comment._id } },
            { useFindAndModify: false }
        )
        const isQuestion = !!(questionId === resourceId)

        await Resource.updateOne(
            { _id: resourceId },
            {
                $push: {
                    comments: comment._id,
                    ...(isQuestion ? { followers: accountId } : {}),
                },
                $inc: { followersCount: isQuestion ? 1 : 0, commentsCount: 1 },
            },
            { useFindAndModify: false }
        )
        if (!isQuestion) {
            await Resource.updateOne(
                { _id: questionId },
                {
                    $push: {
                        followers: accountId,
                    },
                    $inc: { followersCount: 1 },
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
            throw new ApiError(httpStatus.BAD_REQUEST, 'Not created')
        }

        const clubId = comment.club

        const reputationLean = await getReputationId(accountId, clubId, true)

        const rights = await checkVote(reputationLean, 'create')
        if (!rights) {
            throw new ApiError(httpStatus.CONFLICT, 'Not enough rights')
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
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Not created')
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
            .select('club resource')
            .lean()
            .exec()

        if (!comment) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Not created')
        }

        const clubId = comment.club
        const resourceId = comment.resource
        const reputationLean = await getReputationId(accountId, clubId, true)
        const res = await Comment.deleteOne(
            {
                _id: commentId,
                ...(reputationLean.admin ? {} : { owner: accountId }),
            },
            { useFindAndModify: false }
        )

        if (res.deletedCount) {
            await Resource.updateOne(
                { _id: resourceId },
                {
                    $pull: { comments: commentId },
                    $inc: { commentsCount: -1 },
                },
                { useFindAndModify: false }
            )
            return { success: true }
        }
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Not created')
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
