const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { accountService } = require('../services')

const follow = catchAsync(async (req, res) => {
    await accountService.follow(req)
    res.status(httpStatus.OK).send({ message: 'followed' })
})

const unfollow = catchAsync(async (req, res) => {
    await accountService.unfollow(req)
    res.status(httpStatus.OK).send({ message: 'unfollowed' })
})

const deleteAccount = catchAsync(async (req, res) => {
    await accountService.deleteAccount(req)
    res.status(httpStatus.OK).send({
        message: 'deleted',
        logout: true,
        redirect: 'Home',
    })
})

const starClub = catchAsync(async (req, res) => {
    const added = await accountService.starClub(req)
    res.status(httpStatus.OK).send({ message: added ? 'starred' : 'unstarred' })
})

const seenNotification = catchAsync(async (req, res) => {
    await accountService.seenNotification(req)
    res.status(httpStatus.OK).send()
})

const seenFeed = catchAsync(async (req, res) => {
    await accountService.seenFeed(req)
    res.status(httpStatus.OK).send()
})

const saveNotificationToken = catchAsync(async (req, res) => {
    await accountService.saveNotificationToken(req)
    res.status(httpStatus.OK).send()
})

const removeNotificationToken = catchAsync(async (req, res) => {
    await accountService.removeNotificationToken(req)
    res.status(httpStatus.OK).send()
})

const language = catchAsync(async (req, res) => {
    await accountService.language(req)
    res.status(httpStatus.OK).send()
})

const visitClub = catchAsync(async (req, res) => {
    await accountService.visitClub(req)
    res.status(httpStatus.OK).send()
})

module.exports = {
    follow,
    unfollow,
    deleteAccount,
    starClub,
    seenNotification,
    seenFeed,
    saveNotificationToken,
    removeNotificationToken,
    language,
    visitClub,
}
