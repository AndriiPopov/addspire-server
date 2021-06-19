const httpStatus = require('http-status')
const { Tag } = require('../models')
const ApiError = require('../utils/ApiError')

const saveTags = async (tags) => {
    try {
        if (tags) {
            tags.forEach(async (tag) => {
                const res = await Tag.findById(tag)

                if (!res) {
                    const tagDoc = new Tag({
                        _id: tag,
                        length: tag.length,
                    })
                    await tagDoc.save()
                }
            })
        }
    } catch (error) {}
}

const findTags = async (req) => {
    try {
        const { tag } = req.query
        if (tag) {
            console.log('tag', tag)
            const tags = await Tag.find({
                _id: { $regex: tag, $options: 'gi' },
            })
                .sort('length')
                .limit(20)
                .select('_id')
                .lean()
            return tags.map((i) => i._id)
        }
        throw new ApiError(httpStatus.BAD_REQUEST, 'No tag')
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
