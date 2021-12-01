const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')
const { createInviteTest, acceptInviteTest } = require('../../utils/requests')

setupTestDB()

describe('POST /api/club/invite', () => {
    test(`should return 200 and successfully create an invite,
    return the link, 
    accept invite, 
    not allow accepting same invite again, 
    return 400 on validation fail, 
    allow max 8 residents,
      if data is ok`, async () => {
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
        const oldUser10 = await Account.findOne({ facebookProfile: '10' })
        const userId10 = oldUser10._id.toString()

        await request(app)
            .post('/api/club/create')
            .set('accountId', '0')
            .send({
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                location: null,
                global: true,
            })
            .expect(httpStatus.CREATED)

        const club0 = await Club.findOne({ name: 'Rollers of US' }).lean()
        expect(club0).not.toBeNull()
        const clubId = club0._id.toString()

        await createInviteTest('1', clubId, httpStatus.UNAUTHORIZED)

        const code1 = await createInviteTest('0', clubId)

        expect(code1).toBeDefined()

        const code20 = await createInviteTest('0', clubId)
        expect(code20).toBeDefined()

        expect(code1).not.toEqual(code20)

        await acceptInviteTest(1, code1)

        const club1 = await Club.findById(clubId).lean()
        expect(club1).not.toBeNull()
        expect(club1.adminsCount - club0.adminsCount).toEqual(1)

        const reputation1 = await Reputation.findOne({
            owner: userId1,
            club: clubId,
        }).lean()

        expect(reputation1).toBeDefined()

        expect(reputation1.admin).toBeTruthy()
        expect(reputation1.location).toEqual(club1.location)
        expect(reputation1.global).toEqual(club1.global)
        expect(reputation1.clubAddress).toEqual(club1.clubAddress)
        await acceptInviteTest(1, `${code1}gty`, httpStatus.CONFLICT)
        await acceptInviteTest(1, code1, httpStatus.CONFLICT)
        await acceptInviteTest(1, code20, httpStatus.CONFLICT)
        await acceptInviteTest(1, undefined, httpStatus.BAD_REQUEST)
        await acceptInviteTest(2, code20, httpStatus.CONFLICT)

        const code2 = await createInviteTest('1', clubId)
        expect(code2).toBeDefined()
        await acceptInviteTest(2, code2, httpStatus.OK)

        const code3 = await createInviteTest('2', clubId)
        const code4 = await createInviteTest('2', clubId)
        const code5 = await createInviteTest('2', clubId)
        const code6 = await createInviteTest('2', clubId)
        const code7 = await createInviteTest('2', clubId)
        const code8 = await createInviteTest('2', clubId)
        const code9 = await createInviteTest('2', clubId)
        const code10 = await createInviteTest('2', clubId)

        await acceptInviteTest(3, code3, httpStatus.OK)
        await acceptInviteTest(4, code4, httpStatus.OK)
        await acceptInviteTest(5, code5, httpStatus.OK)
        await acceptInviteTest(6, code6, httpStatus.OK)
        await acceptInviteTest(7, code7, httpStatus.OK)
        await acceptInviteTest(8, code8, httpStatus.CONFLICT)
        await acceptInviteTest(9, code9, httpStatus.CONFLICT)
        await acceptInviteTest(10, code10, httpStatus.CONFLICT)
    })
})
