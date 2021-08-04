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
        message: 'created',
    })
})

const editClub = catchAsync(async (req, res) => {
    await clubService.editClub(req)
    res.status(httpStatus.CREATED).send({ message: 'saved' })
})

const invite = catchAsync(async (req, res) => {
    const inviteLink = await clubService.invite(req)
    res.status(httpStatus.OK).send({
        inviteLink,
    })
})

const acceptInvite = catchAsync(async (req, res) => {
    await clubService.acceptInvite(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const addResident = catchAsync(async (req, res) => {
    await clubService.addResident(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const leaveResidence = catchAsync(async (req, res) => {
    await clubService.leaveResidence(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const requestResidence = catchAsync(async (req, res) => {
    await clubService.requestResidence(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const acceptResidenceRequest = catchAsync(async (req, res) => {
    await clubService.acceptResidenceRequest(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const declineResidenceRequest = catchAsync(async (req, res) => {
    await clubService.declineResidenceRequest(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const editStartRule = catchAsync(async (req, res) => {
    await clubService.editStartRule(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

const ban = catchAsync(async (req, res) => {
    await clubService.ban(req)
    res.status(httpStatus.OK).send({ message: 'success' })
})

const editReputation = catchAsync(async (req, res) => {
    await clubService.editReputation(req)
    res.status(httpStatus.OK).send({ message: 'saved' })
})

const getReputationId = catchAsync(async (req, res) => {
    const reputationId = await clubService.getReputationId(req)
    res.status(httpStatus.OK).send({ reputationId })
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
    editStartRule,
    ban,
    editReputation,
    getReputationId,
}
