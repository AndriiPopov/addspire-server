const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { resourceService } = require('../services')

const createResource = catchAsync(async (req, res) => {
    await resourceService.createResource(req)
    res.status(httpStatus.OK).send({ message: 'created' })
})

const editResource = catchAsync(async (req, res) => {
    await resourceService.editResource(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

const deleteResource = catchAsync(async (req, res) => {
    await resourceService.deleteResource(req)
    res.send({ message: 'deleted' })
})

const acceptAnswer = catchAsync(async (req, res) => {
    await resourceService.acceptAnswer(req)
    res.send({ message: 'success' })
})

const vote = catchAsync(async (req, res) => {
    await resourceService.vote(req)
    res.send({ message: 'success' })
})

module.exports = {
    createResource,
    editResource,
    deleteResource,
    acceptAnswer,
    vote,
}
