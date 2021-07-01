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

const deleteAccount = catchAsync(async (req, res) => {
    await accountService.deleteAccount(req)
    res.status(httpStatus.OK).send({ message: 'deleted' })
})

const starClub = catchAsync(async (req, res) => {
    const added = await accountService.starClub(req)
    res.status(httpStatus.OK).send({ message: added ? 'starred' : 'unstarred' })
})

const editAccount = catchAsync(async (req, res) => {
    await accountService.editAccount(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

const seenNotification = catchAsync(async (req, res) => {
    await accountService.seenNotification(req)
    res.status(httpStatus.OK).send()
})

module.exports = {
    follow,
    unfollow,
    deleteAccount,
    starClub,
    editAccount,
    seenNotification,
}
