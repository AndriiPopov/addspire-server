const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { searchService } = require('../services')

const general = catchAsync(async (req, res) => {
    const result = await searchService.general(req)
    res.status(httpStatus.OK).send(result)
})

const question = catchAsync(async (req, res) => {
    const result = await searchService.question(req)
    res.status(httpStatus.OK).send(result)
})

const answer = catchAsync(async (req, res) => {
    const result = await searchService.answer(req)
    res.status(httpStatus.OK).send(result)
})

const reputation = catchAsync(async (req, res) => {
    const result = await searchService.reputation(req)
    res.status(httpStatus.OK).send(result)
})

module.exports = {
    general,
    reputation,
    question,
    answer,
}
