const httpStatus = require('http-status')
const { selectFields } = require('../config/selectFields')
const ApiError = require('../utils/ApiError')
const getModelFromType = require('../utils/getModelFromType')
const { current } = require('./count.service')

const general = async (req) => {
    try {
        const { body } = req
        const {
            page,
            tags,
            name,
            type,
            clubId,
            ownerId,
            clubName,
            starred,
            banned,
            questionId,
            reputationId,
            followerId,
            sort,
        } = body

        const options = { lean: true, limit: 20 }
        if (page) options.page = page + 1

        const query = {}
        if (clubId) query.club = clubId
        if (ownerId) query.owner = ownerId
        if (reputationId) query.reputation = reputationId
        if (tags) query.tags = { $all: tags }
        else if (name) query.$text = { $search: name }
        else if (clubName) query.$text = { $search: clubName }
        if (starred) query.starred = starred
        if (banned) query.banned = banned
        if (questionId) query.question = questionId
        if (followerId) query.followers = followerId

        switch (type) {
            case 'club':
                options.sort = { reputationsCount: -1 }
                options.select = selectFields.clubD
                break
            case 'question':
                options.sort = { date: -1 }
                options.select = selectFields.questionD
                break
            case 'account':
                options.sort = { reputationsCount: -1 }
                options.select = selectFields.accountD
                break
            case 'reputation':
                options.sort = { reputation: -1 }
                options.select = selectFields.reputationD
                break
            case 'comment':
                options.sort = { vote: -1 }
                break
            case 'answer':
                options.sort = { vote: -1 }
                options.select = selectFields.answer
                break
            default:
                return
        }

        if (sort) options.sort = sort

        const model = getModelFromType(type)
        const result = await model.paginate(query, options)
        let count = null
        if (type === 'question') {
            count = await current({
                body: { ids: result.docs.map((item) => item._id) },
            })
        }
        return { ...result, count }
    } catch (error) {
        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    }
}

module.exports = {
    general,
}
