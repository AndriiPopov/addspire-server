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
                        $set: {
                            _id: tag,
                            length: tag.length,
                        },
                        $inc: {
                            count: 1,
                        },
                    },
                    {
                        upsert: true,
                        useFindAndModify: false,
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
                _id: { $regex: `^${tag.toLowerCase()}` },
            })
                .sort('count')
                .limit(20)
                .select('_id count')
                .lean()
            return tags
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
