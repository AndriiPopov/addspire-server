const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { voteService } = require('../services')

const acceptAnswer = catchAsync(async (req, res) => {
    await voteService.acceptAnswer(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const vote = catchAsync(async (req, res) => {
    await voteService.vote(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

module.exports = {
    acceptAnswer,
    vote,
}
