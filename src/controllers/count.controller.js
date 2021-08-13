const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { countService } = require('../services')

const current = catchAsync(async (req, res) => {
    const count = await countService.current(req)
    res.status(httpStatus.OK).send(count)
})

module.exports = {
    current,
}
