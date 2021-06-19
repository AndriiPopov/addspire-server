const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')
const value = require('../../../src/config/value')

setupTestDB()

describe('POST /api/club/invite', () => {
    test(`should return 200 and create request if data is ok,
    fail if already an admin, 
    fail if too many admins, 
    return 400 on validation fail,
    accept request if data is ok,
    fail accept if too many admins,
    decline request`, async () => {
        const oldUser0 = await Account.findOne({ facebookProfile: 'f_0' })
        const userId0 = oldUser0._id.toString()
        const oldUser1 = await Account.findOne({ facebookProfile: 'f_1' })
        const userId1 = oldUser1._id.toString()
        const oldUser2 = await Account.findOne({ facebookProfile: 'f_2' })
        const userId2 = oldUser2._id.toString()
        const oldUser3 = await Account.findOne({ facebookProfile: 'f_3' })
        const userId3 = oldUser3._id.toString()
        const oldUser4 = await Account.findOne({ facebookProfile: 'f_4' })
        const userId4 = oldUser4._id.toString()
        const oldUser5 = await Account.findOne({ facebookProfile: 'f_5' })
        const userId5 = oldUser5._id.toString()
        const oldUser6 = await Account.findOne({ facebookProfile: 'f_6' })
        const userId6 = oldUser6._id.toString()
        const oldUser7 = await Account.findOne({ facebookProfile: 'f_7' })
        const userId7 = oldUser7._id.toString()
        const oldUser8 = await Account.findOne({ facebookProfile: 'f_8' })
        const userId8 = oldUser8._id.toString()
        const oldUser9 = await Account.findOne({ facebookProfile: 'f_9' })
        const userId9 = oldUser9._id.toString()

        await request(app)
            .post('/api/club/create')
            .set('accountId', 'f_0')
            .send({
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                startConversation: 'any',
            })
            .expect(httpStatus.CREATED)

        const club0 = await Club.findOne({ name: 'Rollers of US' })
        expect(club0).not.toBeNull()
        const clubId = club0._id.toString()

        const requestResidence = async (
            id,
            expected,
            message,
            contact,
            _clubId
        ) => {
            await request(app)
                .post('/api/club/request-residence')
                .set('accountId', `f_${id}`)
                .send({
                    clubId: _clubId || clubId,
                    message: message || `I am ${id} and want to be an admin.`,
                    contact: contact || `Find ${id} here`,
                })
                .expect(expected || httpStatus.OK)
        }
        const accept = async (id, residentId, requestId, expected, _clubId) => {
            await request(app)
                .post('/api/club/accept-residence-request')
                .set('accountId', `f_${id}`)
                .send({
                    clubId: _clubId || clubId,
                    residentId,
                    requestId,
                })
                .expect(expected || httpStatus.OK)
        }

        const decline = async (
            id,
            residentId,
            requestId,
            expected,
            _clubId
        ) => {
            await request(app)
                .post('/api/club/decline-residence-request')
                .set('accountId', `f_${id}`)
                .send({
                    clubId: _clubId || clubId,
                    residentId,
                    requestId,
                })
                .expect(expected || httpStatus.OK)
        }

        await requestResidence(0, httpStatus.CONFLICT)
        await requestResidence(1, httpStatus.BAD_REQUEST, 'f')
        await requestResidence(1, httpStatus.BAD_REQUEST, '', 'f')
        await requestResidence(1, httpStatus.BAD_REQUEST, '', '', {})

        await requestResidence(1)

        const club1 = await Club.findById(clubId)
        expect(club1).not.toBeNull()

        expect(
            club1.residenceRequests.length - club0.residenceRequests.length
        ).toEqual(1)

        const req = club1.residenceRequests.find((i) => i.accountId === userId1)
        expect(req).toBeDefined()
        expect(req).toMatchObject({
            accountId: userId1,
            message: `I am 1 and want to be an admin.`,
            contact: `Find 1 here`,
        })
        const reqId1 = req._id.toString()

        await requestResidence(1, httpStatus.CONFLICT)

        await decline(3, userId1, reqId1, httpStatus.UNAUTHORIZED)
        await decline(0, userId1, {}, httpStatus.BAD_REQUEST)
        await decline(0, userId1, reqId1, httpStatus.CONFLICT, 'dasdasd')
        await decline(0, userId1, reqId1)

        const club2 = await Club.findById(clubId)
        expect(club2).not.toBeNull()

        expect(
            club2.residenceRequests.length - club1.residenceRequests.length
        ).toEqual(-1)

        const req1 = club2.residenceRequests.find(
            (i) => i.accountId === userId1
        )
        expect(req1).not.toBeDefined()

        await requestResidence(1)
        await requestResidence(9)

        const club3 = await Club.findById(clubId)
        expect(club3).not.toBeNull()

        expect(
            club3.residenceRequests.length - club2.residenceRequests.length
        ).toEqual(2)

        const req3 = club3.residenceRequests.find(
            (i) => i.accountId === userId1
        )
        expect(req3).toBeDefined()
        expect(req3).toMatchObject({
            accountId: userId1,
            message: `I am 1 and want to be an admin.`,
            contact: `Find 1 here`,
        })
        const reqId3 = req3._id.toString()

        await accept(3, userId1, reqId3, httpStatus.UNAUTHORIZED)
        await accept(0, userId1, {}, httpStatus.BAD_REQUEST)
        await accept(0, userId1, reqId3, httpStatus.UNAUTHORIZED, 'dasdasd')
        await accept(0, userId1, reqId3)

        const club4 = await Club.findById(clubId)
        expect(club4).not.toBeNull()

        expect(
            club4.residenceRequests.length - club3.residenceRequests.length
        ).toEqual(-1)

        const req4 = club4.residenceRequests.find(
            (i) => i.accountId === userId1
        )
        expect(req4).not.toBeDefined()

        const reputation1 = club4.adminReputations.find(
            (i) => i.accountId === userId1
        )
        expect(reputation1).toBeDefined()
        const reputationId1 = reputation1.reputationId.toString()
        const reputationObj1 = await Reputation.findById(reputationId1)
        expect(reputationObj1).toBeDefined()
        expect(reputationObj1.admin).toBeTruthy()

        expect(
            club4.reputations.find((i) => i.reputationId === reputationId1)
        ).toBeDefined()
        expect(
            club4.adminReputations.find((i) => i.reputationId === reputationId1)
        ).toBeDefined()

        expect(club4.adminsCount - club3.adminsCount).toEqual(1)
        expect(club4.adminsCount).toEqual(club4.adminReputations.length)

        await requestResidence(2)
        await requestResidence(3)
        await requestResidence(4)
        await requestResidence(5)
        await requestResidence(6)
        await requestResidence(7)

        const club5 = await Club.findById(clubId)
        expect(club5).not.toBeNull()

        expect(
            club5.residenceRequests.length - club4.residenceRequests.length
        ).toEqual(6)

        const req_2 = club5.residenceRequests.find(
            (i) => i.accountId === userId2
        )
        const req_3 = club5.residenceRequests.find(
            (i) => i.accountId === userId3
        )
        const req_4 = club5.residenceRequests.find(
            (i) => i.accountId === userId4
        )
        const req_5 = club5.residenceRequests.find(
            (i) => i.accountId === userId5
        )
        const req_6 = club5.residenceRequests.find(
            (i) => i.accountId === userId6
        )
        const req_7 = club5.residenceRequests.find(
            (i) => i.accountId === userId7
        )
        const req_9 = club5.residenceRequests.find(
            (i) => i.accountId === userId9
        )

        await accept(1, userId2, req_2._id)
        await accept(2, userId3, req_3._id)
        await accept(2, userId4, req_4._id)
        await accept(2, userId5, req_5._id)
        await accept(2, userId6, req_6._id)
        await accept(2, userId7, req_7._id)

        const club6 = await Club.findById(clubId)
        expect(club5).not.toBeNull()

        expect(
            club6.residenceRequests.length - club5.residenceRequests.length
        ).toEqual(-6)
        expect(club6.adminsCount).toEqual(value.maxAdmins)
        expect(club6.adminReputations.length).toEqual(club6.adminsCount)

        await requestResidence(8, httpStatus.CONFLICT)
        await accept(2, userId9, req_9._id, httpStatus.BAD_REQUEST)
    })
})
