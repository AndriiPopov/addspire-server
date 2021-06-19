const httpStatus = require('http-status')
const { tagService } = require('.')
const value = require('../config/value')
const {
    Resource,
    System,
    Club,
    Account,
    Reputation,
    Comment,
} = require('../models')
const ApiError = require('../utils/ApiError')

const { checkVote } = require('../utils/checkRights')
const getReputationId = require('../utils/getReputationId')
const { saveTags } = require('./tag.service')

const searchResources = async (req) => {
    const { body } = req
    const { text, page, type, owner, clubId } = body

    const query = {}
    if (text) query.text = text
    if (owner) query.owner = owner
    query.resourceType = type || 'question'
    if (clubId) query.club = clubId

    const options = { lean: true, sort: { date: -1 } }
    if (page) options.page = page + 1
    const result = await Resource.paginate(query, options)
    return result
}

const searchAnswers = async (req) => {
    const { body } = req
    const { questionId, page, sortBy } = body

    if (!questionId) return null

    const query = { question: questionId }

    const options = { lean: true, sort: 'vote' }
    if (page) options.page = page + 1
    if (sortBy) options.sort = 'vote'
    const result = await Resource.paginate(query, options)
    return result
}

const createResource = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { clubId, type, questionId, name, description, images, tags } =
            body
        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'start')
        if (!rights) {
            throw new ApiError(httpStatus.CONFLICT, 'Not enough rights')
        }

        const resource = new Resource({
            name,
            images,
            description,
            tags,
            followers: [accountId],
            followersCount: 1,
            owner: accountId,
            club: clubId,
            resourceType: type,
            question: questionId,
        })
        saveTags(tags)
        const newNotificationId = await System.getNotificationId()
        const notification = {
            $each: [
                {
                    user: accountId,
                    code:
                        // eslint-disable-next-line no-nested-ternary
                        type === 'question'
                            ? 'asked question'
                            : type === 'answer'
                            ? 'answered question'
                            : 'added article',
                    details: { id: resource._id, clubId, questionId },
                    notId: newNotificationId,
                },
            ],
            $slice: 5,
        }
        let prefix = 'questions'
        let success
        switch (type) {
            case 'question': {
                prefix = 'questions'
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
                prefix = 'answers'

                const res = await Resource.updateOne(
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
            case 'article': {
                prefix = 'articles'
                await Club.updateOne(
                    { _id: clubId },
                    {
                        $push: {
                            articles: resource._id,
                            notifications: notification,
                        },
                        $inc: { articlesCount: 1 },
                    },
                    { useFindAndModify: false }
                )
                success = true
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
                $push: { [prefix]: resource._id },
            },
            { useFindAndModify: false }
        )
        await Account.updateOne(
            { _id: accountId },
            {
                $addToSet: {
                    followingResources: questionId || resource._id,
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

const editResource = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account

        const { resourceId, name, description, images, tags } = body

        const question = await Resource.findById(resourceId)
            .select('club')
            .lean()
            .exec()
        if (!question) {
            throw new ApiError(httpStatus.CONFLICT, 'No club')
        }

        const clubId = question.club

        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, 'create')
        if (!rights) {
            throw new ApiError(httpStatus.CONFLICT, 'Not enough rights')
        }

        const res = await Resource.updateOne(
            {
                _id: resourceId,
                club: clubId,
                ...(reputationLean.admin ? {} : { owner: accountId }),
            },
            {
                $set: {
                    name,
                    description,
                    images,
                    tags,
                },
            },
            { useFindAndModify: false }
        )
        saveTags(tags)

        if (!res.nModified) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not created')
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

        const question = await Resource.findById(resourceId)
            .select('club question')
            .lean()
            .exec()
        if (!question) {
            throw new ApiError(httpStatus.CONFLICT, 'No club')
        }

        const clubId = question.club
        const questionId = question.question

        const reputationLean = await getReputationId(accountId, clubId, true)

        if (!reputationLean.admin) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'Not enough rights')
        }
        // const newNotificationId = await System.getNotificationId()
        // const notification = {
        //     $each: [
        //         {
        //             user: accountId,
        //             code: 'delete',
        //             details: { id: resourceId },
        //             notId: newNotificationId,
        //         },
        //     ],
        //     $slice: 5,
        // }

        await Resource.deleteOne(
            { _id: resourceId, club: clubId },
            { useFindAndModify: false }
        )

        if (questionId && type === 'answer') {
            await Resource.updateOne(
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
        } else if (type === 'question' || type === 'article') {
            await Club.updateOne(
                { _id: clubId },
                {
                    $pull: {
                        [type === 'question' ? 'questions' : 'articles']:
                            resourceId,
                    },
                    $inc: {
                        [type === 'question'
                            ? 'questionsCount'
                            : 'articlesCount']: -1,
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

const acceptAnswer = async (req) => {
    try {
        const { account, body } = req
        const { _id: accountId } = account
        const { answerId } = body

        const answer = await Resource.findById(answerId)
            .select('owner question club')
            .lean()
            .exec()

        if (!answer) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Not created')
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
            $slice: 5,
        }

        const result = await Resource.updateOne(
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
                { useFindAndModify: false }
            )
            return { success: true }
        }
        throw new ApiError(httpStatus.BAD_REQUEST, 'Not created')
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

        const model = type === 'resource' ? Resource : Comment

        const resource = await Resource.findById(resourceId)
            .select('question club owner')
            .lean()
            .exec()

        if (!resource) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Not created')
        }

        const clubId = resource.club

        const reputationLean = await getReputationId(accountId, clubId, true)
        const rights = await checkVote(reputationLean, minus ? 'minus' : 'plus')
        if (!rights) {
            throw new ApiError(httpStatus.CONFLICT, 'Not enough rights')
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
                    $inc: {
                        reputation: repChange,
                    },
                },
                { useFindAndModify: false }
            )
        } else {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Already voted')
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}
module.exports = {
    searchResources,
    searchAnswers,
    createResource,
    editResource,
    deleteResource,
    acceptAnswer,
    vote,
}
