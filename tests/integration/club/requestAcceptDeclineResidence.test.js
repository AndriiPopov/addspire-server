const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')
const value = require('../../../src/config/value')
const {
    requestResidenceTest,
    declineResidenceRequestTest,
    acceptResidenceTest,
} = require('../../utils/requests')

setupTestDB()

describe('POST /api/club', () => {
    test(`should return 200 and create request if data is ok,
    fail if already an admin, 
    fail if too many admins, 
    return 400 on validation fail,
    accept request if data is ok,
    fail accept if too many admins,
    decline request`, async () => {
        const oldUser0 = await Account.findOne({ facebookProfile: '0' })
        const userId0 = oldUser0._id.toString()
        const oldUser1 = await Account.findOne({ facebookProfile: '1' })
        const userId1 = oldUser1._id.toString()
        const oldUser2 = await Account.findOne({ facebookProfile: '2' })
        const userId2 = oldUser2._id.toString()
        const oldUser3 = await Account.findOne({ facebookProfile: '3' })
        const userId3 = oldUser3._id.toString()
        const oldUser4 = await Account.findOne({ facebookProfile: '4' })
        const userId4 = oldUser4._id.toString()
        const oldUser5 = await Account.findOne({ facebookProfile: '5' })
        const userId5 = oldUser5._id.toString()
        const oldUser6 = await Account.findOne({ facebookProfile: '6' })
        const userId6 = oldUser6._id.toString()
        const oldUser7 = await Account.findOne({ facebookProfile: '7' })
        const userId7 = oldUser7._id.toString()
        const oldUser8 = await Account.findOne({ facebookProfile: '8' })
        const userId8 = oldUser8._id.toString()
        const oldUser9 = await Account.findOne({ facebookProfile: '9' })
        const userId9 = oldUser9._id.toString()

        await request(app)
            .post('/api/club/create')
            .set('accountId', '0')
            .send({
                name: 'Rollers of USRollers of US',
                description: 'For all of usFor all of usFor all of us',
                image: 'roller.jpeg',
                location: { latitude: 20, longitude: 10 },
                clubAddress: 'Kremenchuk, 35100',
                global: false,

                tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
            })
            .expect(httpStatus.CREATED)

        const club0 = await Club.findOne({
            name: 'Rollers of USRollers of US',
        }).lean()
        expect(club0).not.toBeNull()
        const clubId = club0._id.toString()

        await requestResidenceTest(0, httpStatus.CONFLICT, '', '', clubId)
        await requestResidenceTest(1, httpStatus.BAD_REQUEST, 'f', '', clubId)
        await requestResidenceTest(1, httpStatus.BAD_REQUEST, '', '', {})

        await requestResidenceTest(1, undefined, '', '', clubId)

        const club1 = await Club.findById(clubId).lean()

        expect(club1.location).toMatchObject({
            type: 'Point',
            coordinates: [10, 20],
        })
        expect(club1.clubAddress).toEqual('Kremenchuk, 35100')
        expect(club1.global).toBeFalsy()

        expect(
            club1.residenceRequests.length - club0.residenceRequests.length
        ).toEqual(1)

        const req = club1.residenceRequests.find((i) => i.accountId === userId1)
        expect(req).toBeDefined()
        expect(req).toMatchObject({
            accountId: userId1,
            message: `I am 1 and want to be an admin.`,
        })
        const reqId1 = req._id.toString()

        await requestResidenceTest(1, httpStatus.CONFLICT, '', '', clubId)

        await declineResidenceRequestTest(
            3,
            userId1,
            reqId1,
            httpStatus.UNAUTHORIZED,
            clubId
        )
        await declineResidenceRequestTest(
            0,
            userId1,
            {},
            httpStatus.BAD_REQUEST,
            clubId
        )
        await declineResidenceRequestTest(
            0,
            userId1,
            reqId1,
            httpStatus.BAD_REQUEST,
            'dasdasd'
        )
        await declineResidenceRequestTest(0, userId1, reqId1, undefined, clubId)

        const club2 = await Club.findById(clubId)
        expect(club2).not.toBeNull()

        expect(
            club2.residenceRequests.length - club1.residenceRequests.length
        ).toEqual(-1)

        const req1 = club2.residenceRequests.find(
            (i) => i.accountId === userId1
        )
        expect(req1).not.toBeDefined()

        await requestResidenceTest(1, undefined, '', '', clubId)
        await requestResidenceTest(9, undefined, '', '', clubId)

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
        })
        const reqId3 = req3._id.toString()

        await acceptResidenceTest(
            3,
            userId1,
            reqId3,
            httpStatus.UNAUTHORIZED,
            clubId
        )
        await acceptResidenceTest(
            0,
            userId1,
            {},
            httpStatus.BAD_REQUEST,
            clubId
        )
        await acceptResidenceTest(
            0,
            userId1,
            reqId3,
            httpStatus.BAD_REQUEST,
            'dasdasd'
        )
        await acceptResidenceTest(0, userId1, reqId3, undefined, clubId)
        const club4 = await Club.findById(clubId)
        expect(club4).not.toBeNull()

        expect(
            club4.residenceRequests.length - club3.residenceRequests.length
        ).toEqual(-1)

        const user1 = await Account.findById(userId1).lean()

        const reputationObj1 = await Reputation.findOne({
            club: clubId,
            owner: userId1,
        })
            .lean()
            .exec()
        const reputationId1 = reputationObj1._id.toString()
        const req4 = club4.residenceRequests.find(
            (i) => i.accountId === userId1
        )
        expect(req4).not.toBeDefined()

        expect(club4.adminReputations).toContain(reputationId1)
        expect(reputationObj1).toBeDefined()
        expect(reputationObj1.admin).toBeTruthy()
        expect(reputationObj1.location).toEqual(club1.location)
        expect(reputationObj1.global).toEqual(club1.global)

        expect(club4.adminsCount - club3.adminsCount).toEqual(1)
        expect(club4.adminsCount).toEqual(club4.adminReputations.length)

        await requestResidenceTest(2, undefined, '', '', clubId)
        await requestResidenceTest(3, undefined, '', '', clubId)
        await requestResidenceTest(4, undefined, '', '', clubId)
        await requestResidenceTest(5, undefined, '', '', clubId)
        await requestResidenceTest(6, undefined, '', '', clubId)
        await requestResidenceTest(7, undefined, '', '', clubId)

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

        await acceptResidenceTest(1, userId2, req_2._id, undefined, clubId)
        await acceptResidenceTest(2, userId3, req_3._id, undefined, clubId)
        await acceptResidenceTest(2, userId4, req_4._id, undefined, clubId)
        await acceptResidenceTest(2, userId5, req_5._id, undefined, clubId)
        await acceptResidenceTest(2, userId6, req_6._id, undefined, clubId)
        await acceptResidenceTest(2, userId7, req_7._id, undefined, clubId)

        const club6 = await Club.findById(clubId)
        expect(club5).not.toBeNull()

        expect(
            club6.residenceRequests.length - club5.residenceRequests.length
        ).toEqual(-6)
        expect(club6.adminsCount).toEqual(value.maxAdmins)
        expect(club6.adminReputations.length).toEqual(club6.adminsCount)

        await requestResidenceTest(8, httpStatus.CONFLICT, '', '', clubId)
        await acceptResidenceTest(
            2,
            userId9,
            req_9._id,
            httpStatus.CONFLICT,
            clubId
        )
    })
})
