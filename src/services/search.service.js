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
            // name,
            type,
            clubId,
            ownerId,
            profileId,
            // clubName,
            starred,
            banned,
            questionId,
            reputationId,
            followerId,
            sort,
            global,
            location,
            idIn,
            post,
            general: generalBody,
        } = body

        const tagsExist = tags && tags.length

        const options = { lean: true, limit: 20 }
        if (page) options.page = page + 1

        const query = {}

        if (idIn) query._id = { $in: idIn }

        if (typeof post === 'boolean') query.post = post
        if (location) {
            query.location = {
                $geoWithin: {
                    $centerSphere: [
                        [location.longitude, location.latitude],
                        location.distance / 6378.1,
                    ],
                },
            }
        }
        if (generalBody) query.global = global || false
        if (clubId) query.club = clubId
        if (ownerId) query.owner = ownerId
        if (profileId) query.profile = profileId
        if (reputationId) query.reputation = reputationId
        // eslint-disable-next-line prefer-destructuring
        if (tagsExist) query.tags = tags[0]
        // else if (name) query.name = { $search: name }
        // else if (clubName) query.$text = { $search: clubName }
        if (starred) query.starred = starred
        if (banned) query.banned = banned
        if (questionId) query.question = questionId
        if (followerId) query.followers = followerId

        switch (type) {
            case 'club':
                options.sort = { followersCount: -1 }
                options.select = selectFields.clubD
                break
            case 'question':
                options.sort = { [!tagsExist ? 'date' : 'vote']: -1 }
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
                options.sort = { date: -1 }
                break
            case 'answer':
                options.sort = { [reputationId ? 'date' : 'vote']: -1 }
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
