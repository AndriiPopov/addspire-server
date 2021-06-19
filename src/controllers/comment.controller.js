const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { commentService } = require('../services')

const createComment = catchAsync(async (req, res) => {
    await commentService.createComment(req)
    res.status(httpStatus.OK).send()
})

const editComment = catchAsync(async (req, res) => {
    await commentService.editComment(req)
    res.status(httpStatus.OK).send()
})

const deleteComment = catchAsync(async (req, res) => {
    await commentService.deleteComment(req)
    res.status(httpStatus.OK).send()
})

module.exports = {
    createComment,
    editComment,
    deleteComment,
}
