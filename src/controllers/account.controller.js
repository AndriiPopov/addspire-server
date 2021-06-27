const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { accountService } = require('../services')

const follow = catchAsync(async (req, res) => {
    await accountService.follow(req)
    res.status(httpStatus.OK).send()
})

const unfollow = catchAsync(async (req, res) => {
    await accountService.unfollow(req)
    res.status(httpStatus.OK).send()
})

const ban = catchAsync(async (req, res) => {
    await accountService.ban(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const deleteAccount = catchAsync(async (req, res) => {
    await accountService.deleteAccount(req)
    res.status(httpStatus.OK).send({ message: 'deleted' })
})

const addBookmark = catchAsync(async (req, res) => {
    await accountService.addBookmark(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const removeBookmark = catchAsync(async (req, res) => {
    await accountService.removeBookmark(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const editAccount = catchAsync(async (req, res) => {
    await accountService.editAccount(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

module.exports = {
    follow,
    unfollow,
    ban,
    deleteAccount,
    addBookmark,
    removeBookmark,
    editAccount,
}
