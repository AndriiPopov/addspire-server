const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { answerService } = require('../services')

const create = catchAsync(async (req, res) => {
    await answerService.create(req)
    res.status(httpStatus.OK).send({ message: 'created' })
})

const edit = catchAsync(async (req, res) => {
    await answerService.edit(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

const remove = catchAsync(async (req, res) => {
    await answerService.remove(req)
    res.status(httpStatus.OK).send({ message: 'deleted' })
})

module.exports = {
    create,
    edit,
    remove,
}
