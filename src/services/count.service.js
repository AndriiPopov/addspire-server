const httpStatus = require('http-status')
const { Count } = require('../models')
const ApiError = require('../utils/ApiError')

const current = async (req) => {
    try {
        const { body } = req
        const { ids } = body

        const count = await Count.find({ question: { $in: ids } })
            .select('total')
            .lean()
            .exec()

        if (count && count.length > 0) {
            return count
        }
        return []
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

module.exports = {
    current,
}
