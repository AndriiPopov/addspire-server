const httpStatus = require('http-status')
const { Tag } = require('../models')
const ApiError = require('../utils/ApiError')

const saveTags = async (tags) => {
    try {
        if (tags) {
            tags.forEach(async (item) => {
                const tag = item.toLowerCase()
                await Tag.findOneAndUpdate(
                    { _id: tag },
                    {
                        _id: tag,
                        length: tag.length,
                    },
                    {
                        upsert: true,
                    }
                )
            })
        }
    } catch (error) {}
}

const findTags = async (req) => {
    try {
        const { tag } = req.query
        if (tag) {
            const tags = await Tag.find({
                _id: { $regex: tag.toLowerCase(), $options: 'gi' },
            })
                .sort('length')
                .limit(20)
                .select('_id')
                .lean()
            return tags.map((i) => i._id)
        }
        throw new ApiError(httpStatus.CONFLICT, 'No tag')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not found')
        } else throw error
    }
}

module.exports = {
    saveTags,
    findTags,
}
