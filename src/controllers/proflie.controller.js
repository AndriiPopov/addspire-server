const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { profileService } = require('../services')

const createProfile = catchAsync(async (req, res) => {
    await profileService.createProfile(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

const editProfile = catchAsync(async (req, res) => {
    await profileService.editProfile(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

const deleteProfile = catchAsync(async (req, res) => {
    await profileService.deleteProfile(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

const chooseDefaultProfile = catchAsync(async (req, res) => {
    await profileService.chooseDefaultProfile(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

module.exports = {
    createProfile,
    editProfile,
    deleteProfile,
    chooseDefaultProfile,
}
