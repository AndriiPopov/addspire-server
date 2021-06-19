const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { clubService } = require('../services')

const createClub = catchAsync(async (req, res) => {
    const club = await clubService.createClub(req)
    res.status(httpStatus.CREATED).send({
        redirect: {
            type: 'club',
            _id: club._id,
        },
    })
})

const editClub = catchAsync(async (req, res) => {
    await clubService.editClub(req)
    res.status(httpStatus.CREATED).send()
})

const invite = catchAsync(async (req, res) => {
    const inviteLink = await clubService.invite(req)
    res.status(httpStatus.OK).send({
        inviteLink,
    })
})

const acceptInvite = catchAsync(async (req, res) => {
    await clubService.acceptInvite(req)
    res.status(httpStatus.OK).send()
})

const addResident = catchAsync(async (req, res) => {
    await clubService.addResident(req)
    res.status(httpStatus.OK).send()
})

const leaveResidence = catchAsync(async (req, res) => {
    await clubService.leaveResidence(req)
    res.status(httpStatus.OK).send()
})

const requestResidence = catchAsync(async (req, res) => {
    await clubService.requestResidence(req)
    res.status(httpStatus.OK).send()
})

const acceptResidenceRequest = catchAsync(async (req, res) => {
    await clubService.acceptResidenceRequest(req)
    res.status(httpStatus.OK).send()
})

const declineResidenceRequest = catchAsync(async (req, res) => {
    await clubService.declineResidenceRequest(req)
    res.status(httpStatus.OK).send()
})

module.exports = {
    createClub,
    editClub,
    invite,
    acceptInvite,
    addResident,
    leaveResidence,
    requestResidence,
    acceptResidenceRequest,
    declineResidenceRequest,
}
