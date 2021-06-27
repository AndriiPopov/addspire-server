const httpStatus = require('http-status')
const { tokenService } = require('.')
const config = require('../config/config')
const { selectFields } = require('../config/selectFields')
const { tokenTypes } = require('../config/tokens')
const value = require('../config/value')
const { Account, Club, Reputation, System } = require('../models')
const ApiError = require('../utils/ApiError')
const getReputationId = require('../utils/getReputationId')
const { saveTags } = require('./tag.service')
const getModelFromType = require('../utils/getModelFromType')

const general = async (req) => {
    try {
        const { body } = req
        const { page, tags, type, text, club } = body

        const options = { lean: true }
        if (page) options.page = page + 1

        switch (type) {
            case 'club':
                options.sort = { followersCount: 1 }
                options.select = selectFields.clubD
                break
            case 'resource':
                options.sort = { vote: 1 }
                options.select = selectFields.resourceD
                break
            case 'account':
                options.sort = { reputationsCount: 1 }
                options.select = selectFields.accountD
                break
            case 'reputation':
                options.sort = { eputation: 1 }
                options.select = selectFields.reputationD
                break
            default:
                return
        }

        const query = {}
        if (club) query.club = club
        if (tags) query.tags = { $all: tags }
        else if (text) query.name = text

        if (query.name && type === 'resource') query.resourceType = 'question'
        if (query.name && type === 'reputation') return

        const model = getModelFromType(type)
        const result = await model.paginate(query, options)
        return result
    } catch (error) {
        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    }
}

const reputation = async (req) => {
    try {
        const { body } = req
        const { reputationIds, page } = body

        const options = {
            lean: true,
            sort: { reputation: 1 },
            select: selectFields.reputationD,
        }
        if (page) options.page = page + 1
        const result = await Reputation.paginate(
            { $in: reputationIds },
            options
        )
        return result
    } catch (error) {}
}

const question = async (req) => {
    const { body } = req
    const { text, page, type, owner, clubId } = body

    const query = {}
    if (text) query.text = text
    if (owner) query.owner = owner
    query.resourceType = type || 'question'
    if (clubId) query.club = clubId

    const options = {
        lean: true,
        sort: { date: -1 },
        select: selectFields.resourceD,
    }
    if (page) options.page = page + 1
    const result = await Resource.paginate(query, options)
    return result
}

const answer = async (req) => {
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

module.exports = {
    general,
    reputation,
    question,
    answer,
}
