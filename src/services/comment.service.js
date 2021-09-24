const httpStatus = require('http-status')

const { Account, System, Comment, Question, Count } = require('../models')
const ApiError = require('../utils/ApiError')
const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')
const getModelFromType = require('../utils/getModelFromType')

const notificationService = require('./notification.service')

const createComment = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { text, resourceId, resourceType, bookmark } = body

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
            question: questionId,
        })

        await comment.save()
        if (bookmark) {
            await Account.updateOne(
                { _id: accountId },
                {
                    $push: {
                        followingQuestions: {
                            $each: [questionId],
                            $slice: -200,
                        },
                    },
                },
                { useFindAndModify: false }
            )
        }
        let followers = []
        let question
        if (isQuestion) {
            question = await model
                .findOneAndUpdate(
                    { _id: resourceId },
                    {
                        $push: {
                            comments: comment._id,
                            ...(bookmark ? { followers: accountId } : {}),
                        },
                        $inc: {
                            followersCount: bookmark ? 1 : 0,
                            commentsCount: 1,
                        },
                    },
                    { useFindAndModify: false }
                )
                .select('followers name')
                .lean()
                .exec()
            followers = question && question.followers
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

            question = bookmark
                ? await Question.findOneAndUpdate(
                      { _id: questionId },
                      {
                          $push: {
                              followers: accountId,
                          },
                          $inc: { followersCount: 1 },
                      },
                      { useFindAndModify: false }
                  )
                      .select('followers name')
                      .lean()
                      .exec()
                : await Question.findById(questionId)
                      .select('followers name')
                      .lean()
                      .exec()
            followers = question && question.followers
        }

        if (followers.length) {
            const newNotificationId = await System.getNotificationId()
            const notifiedAccounts = followers.filter(
                (i) => i.toString() !== accountId.toString()
            )
            await Account.updateOne(
                { _id: { $in: notifiedAccounts } },
                {
                    $push: {
                        feed: {
                            $each: [
                                {
                                    user: accountId,
                                    code: 'commented',
                                    questionId,
                                    details: {},
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
                title: 'New comment',
                body: ` ${reputationLean.name} added a new comment in question ${question.name}`,
                data: {
                    id: question._id,
                    type: 'question',
                },
            })
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
            .select(
                'club resource resourceType question owner vote voteReputation'
            )
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
            await Count.updateOne(
                { question: comment.question },
                {
                    $inc: {
                        [`reputationDestribution.${comment.owner}`]:
                            -comment.voteReputation,
                    },
                },
                { useFindAndModify: false }
            )
        } else throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
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
