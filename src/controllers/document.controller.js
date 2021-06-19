const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { documentService } = require('../services')

const getResource = catchAsync(async (req, res) => {
    const result = await documentService.getResource(req)
    res.status(httpStatus.OK).send(result)
})

const pollResource = catchAsync(async (req, res) => {
    documentService.pollResource(req, res)
})

module.exports = {
    getResource,
    pollResource,
}
