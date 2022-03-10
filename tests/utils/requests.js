const request = require('supertest')
const httpStatus = require('http-status')
const url = require('url')
const app = require('../../src/app')

const requestResidenceTest = async (id, expected, message, contact, clubId) => {
    await request(app)
        .post('/api/club/request-residence')
        .set('accountId', `${id}`)
        .send({
            clubId,
            message: message || `I am ${id} and want to be an admin.`,
        })
        .expect(expected || httpStatus.OK)
}
const acceptResidenceTest = async (
    id,
    residentId,
    requestId,
    expected,
    clubId
) => {
    await request(app)
        .post('/api/club/accept-residence-request')
        .set('accountId', `${id}`)
        .send({
            clubId,
            residentId,
            requestId,
        })
        .expect(expected || httpStatus.OK)
}

const declineResidenceRequestTest = async (
    id,
    residentId,
    requestId,
    expected,
    clubId
) => {
    await request(app)
        .post('/api/club/decline-residence-request')
        .set('accountId', `${id}`)
        .send({
            clubId,
            residentId,
            requestId,
        })
        .expect(expected || httpStatus.OK)
}

const createClubTest = async (id, data, status = httpStatus.CREATED) => {
    const res = await request(app)
        .post('/api/club/create')
        .set('accountId', `${id}`)
        .send({
            location: { latitude: 40, longitude: 50 },
            global: false,
            ...data,
        })
        .expect(status)
    if (!status) {
        expect(res.body).toEqual({
            redirect: expect.anything(),
            message: 'created',
        })
        expect(res.body.redirect._id).toBeDefined()
        return res.body.redirect._id
    }
}

module.exports = {
    requestResidenceTest,
    acceptResidenceTest,
    declineResidenceRequestTest,
    createClubTest,
}
