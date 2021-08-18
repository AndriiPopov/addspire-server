const request = require('supertest')
const httpStatus = require('http-status')
const url = require('url')
const app = require('../../src/app')

const createInviteTest = async (id, clubId, expected) => {
    const res = await request(app)
        .post('/api/club/invite')
        .set('accountId', `f_${id}`)
        .send({ clubId })
        .expect(expected || httpStatus.OK)
    if (res.body.inviteLink) {
        const queryData = url.parse(res.body.inviteLink, true).query
        return queryData.invite
    }
}

const acceptInviteTest = async (id, code, expected) => {
    await request(app)
        .post('/api/club/accept-invite')
        .set('accountId', `f_${id}`)
        .send({ code })
        .expect(expected || httpStatus.OK)
}

const requestResidenceTest = async (id, expected, message, contact, clubId) => {
    await request(app)
        .post('/api/club/request-residence')
        .set('accountId', `f_${id}`)
        .send({
            clubId,
            message: message || `I am ${id} and want to be an admin.`,
            contact: contact || `Find ${id} here`,
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
        .set('accountId', `f_${id}`)
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
        .set('accountId', `f_${id}`)
        .send({
            clubId,
            residentId,
            requestId,
        })
        .expect(expected || httpStatus.OK)
}

const createClubTest = async (id, data) => {
    const res = await request(app)
        .post('/api/club/create')
        .set('accountId', `f_${id}`)
        .send(data)
        .expect(httpStatus.CREATED)

    expect(res.body).toEqual({
        redirect: expect.anything(),
        message: 'created',
    })
    expect(res.body.redirect._id).toBeDefined()
    return res.body.redirect._id
}

module.exports = {
    createInviteTest,
    acceptInviteTest,
    requestResidenceTest,
    acceptResidenceTest,
    declineResidenceRequestTest,
    createClubTest,
}
