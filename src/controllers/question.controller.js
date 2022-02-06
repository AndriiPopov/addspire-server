const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { questionService } = require('../services')

const create = catchAsync(async (req, res) => {
    await questionService.create(req)
    res.status(httpStatus.OK).send({ message: 'created' })
})

const edit = catchAsync(async (req, res) => {
    await questionService.edit(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

const remove = catchAsync(async (req, res) => {
    await questionService.remove(req)
    res.status(httpStatus.OK).send({ message: 'deleted' })
})

const pin = catchAsync(async (req, res) => {
    await questionService.pin(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

module.exports = {
    create,
    edit,
    remove,
    pin,
}
