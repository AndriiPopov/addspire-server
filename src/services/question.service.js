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
    Comment,
} = require('../models')
const ApiError = require('../utils/ApiError')

const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')
const { saveTags } = require('./tag.service')
const getImagesData = require('../utils/getImagesData')

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

            post,
            bookmark,
        } = body
        const reputationLean = await getReputationId(accountId, clubId, true)

        const rights = await checkVote(reputationLean, 'start')
        if (!rights) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }

        const resource = new Question({
            description,
            owner: accountId,
            club: clubId,
            reputation: reputationLean._id,
            name,
            tags,
            post,
        })
        const imagesWithData = getImagesData(
            images,
            accountId,
            clubId,
            resource._id
        )
        resource.images = imagesWithData

        if (bookmark) {
            resource.followers = [accountId]
            resource.followersCount = 1
        }
        if (tags) saveTags(tags)

        const count = new Count({
            question: resource._id,
        })
        await count.save()
        resource.count = count._id

        const newNotificationId = await System.getNotificationId()

        const club = await Club.findOneAndUpdate(
            { _id: clubId },
            {
                $inc: { [post ? 'postsCount' : 'questionsCount']: 1 },
                ...(imagesWithData.length
                    ? {
                          $push: {
                              images: {
                                  $each: [imagesWithData[0]],
                                  $slice: -20,
                              },
                          },
                      }
                    : {}),
            },
            { useFindAndModify: false }
        )
            .select('followers global location')
            .lean()
            .exec()

        if (!club) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        }

        if (club.location) resource.location = club.location
        if (club.global) resource.global = club.global

        await resource.save()

        if (bookmark)
            await Account.updateOne(
                { _id: accountId },
                {
                    $push: {
                        followingQuestions: {
                            $each: [resource._id],
                            $slice: -200,
                        },
                    },
                },
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
                key: resource.post ? 'newPost' : 'newQuestion',
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
                $inc: { [post ? 'postsCount' : 'questionsCount']: 1 },
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

        const { resourceId, name, description, images, tags } = body

        const resource = await Question.findById(resourceId)
            .select('club images')
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

        const imagesWithData = getImagesData(
            images,
            accountId,
            clubId,
            resourceId,
            resource.images
        )

        const res = await Question.updateOne(
            {
                _id: resourceId,
                ...(reputationLean.admin ? {} : { owner: accountId }),
            },
            {
                $set: {
                    description,
                    images: imagesWithData,
                    name,
                    tags,
                },
            },
            { useFindAndModify: false }
        )
        saveTags(tags)

        if (!res.nModified) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }
        if (
            resource.images.length &&
            !imagesWithData.find((i) => i.url === resource.images[0].url)
        )
            await Club.findOneAndUpdate(
                { _id: resource.club },
                {
                    $pull: {
                        images: {
                            url: resource.images[0].url,
                        },
                    },
                },
                { useFindAndModify: false }
            ).exec()
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
            .select('club reputation owner vote images post')
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
            {
                $inc: { [resource.post ? 'postsCount' : 'questionsCount']: -1 },
                $pull: {
                    images: { url: { $in: resource.images.map((i) => i.url) } },
                    pinned: resourceId,
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

const saveBestComment = async (questionId) => {
    const question = await Question.findById(questionId)
        .select('comments post')
        .lean()

    if (question && question.post && question.comments.length) {
        const comments = await Comment.find({ _id: { $in: question.comments } })
            .sort({ vote: -1 })
            .limit(1)
            .select('_id')
            .exec()

        if (comments && comments.length) {
            const comment = comments[0]
            if (comment) {
                const commentId = comment._id
                if (commentId) {
                    await Question.updateOne(
                        { _id: questionId },
                        { $set: { bestAnswer: commentId } },
                        { useFindAndModify: false }
                    )
                }
            }
        }
    }
}

const pin = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { resourceId, unpin } = body

        const resource = await Question.findById(resourceId)
            .select('club ')
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

        await Club.updateOne(
            { _id: clubId },
            unpin
                ? {
                      $push: {
                          pinned: {
                              $each: [resourceId],
                              $slice: -20,
                          },
                      },
                  }
                : { $pull: { pinned: resourceId } },
            { useFindAndModify: false }
        )
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
    saveBestAnswer,
    saveBestComment,
    pin,
}
