const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { resourceService } = require('../services')

const searchResources = catchAsync(async (req, res) => {
    const result = await resourceService.searchResources(req)
    res.status(httpStatus.CREATED).send(result)
})

const searchAnswers = catchAsync(async (req, res) => {
    const result = await resourceService.searchAnswers(req)
    res.status(httpStatus.CREATED).send(result)
})

const createResource = catchAsync(async (req, res) => {
    await resourceService.createResource(req)
    res.status(httpStatus.CREATED).send()
})

const editResource = catchAsync(async (req, res) => {
    await resourceService.editResource(req)
    res.status(httpStatus.OK).send({ success: true })
})

const deleteResource = catchAsync(async (req, res) => {
    await resourceService.deleteResource(req)
    res.send({ success: true })
})

const acceptAnswer = catchAsync(async (req, res) => {
    await resourceService.acceptAnswer(req)
    res.send({ success: true })
})

const vote = catchAsync(async (req, res) => {
    await resourceService.vote(req)
    res.send({ success: true })
})

module.exports = {
    searchResources,
    createResource,
    searchAnswers,
    editResource,
    deleteResource,
    acceptAnswer,
    vote,
}
