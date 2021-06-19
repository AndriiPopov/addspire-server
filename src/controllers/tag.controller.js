const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { tagService } = require('../services')

const findTags = catchAsync(async (req, res) => {
    const tags = await tagService.findTags(req)
    res.status(httpStatus.OK).send({
        tags,
    })
})

module.exports = {
    findTags,
}
