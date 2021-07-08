const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { searchService } = require('../services')

const general = catchAsync(async (req, res) => {
    const result = await searchService.general(req)
    res.status(httpStatus.OK).send(result)
})

module.exports = {
    general,
}
