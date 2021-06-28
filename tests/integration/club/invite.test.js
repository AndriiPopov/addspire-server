const request = require('supertest')
const httpStatus = require('http-status')
const url = require('url')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/club/invite', () => {
    test(`should return 200 and successfully create an invite,
    return the link, 
    accept invite, 
    not allow accepting same invite again, 
    return 400 on validation fail, 
    allow max 8 residents,
      if data is ok`, async () => {
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
        const oldUser10 = await Account.findOne({ facebookProfile: 'f_10' })
        const userId10 = oldUser10._id.toString()

        await request(app)
            .post('/api/club/create')
            .set('accountId', 'f_0')
            .send({
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
            })
            .expect(httpStatus.CREATED)

        const club0 = await Club.findOne({ name: 'Rollers of US' })
        expect(club0).not.toBeNull()
        const clubId = club0._id.toString()

        const createInvite = async (id, expected) => {
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

        const acceptInvite = async (id, code, expected) => {
            await request(app)
                .post('/api/club/accept-invite')
                .set('accountId', `f_${id}`)
                .send({ code })
                .expect(expected || httpStatus.OK)
        }

        await createInvite('1', httpStatus.UNAUTHORIZED)

        const code1 = await createInvite('0')

        expect(code1).toBeDefined()

        const code20 = await createInvite('0')
        expect(code20).toBeDefined()

        expect(code1).not.toEqual(code20)

        await acceptInvite(1, code1)

        const club1 = await Club.findById(clubId)
        expect(club1).not.toBeNull()
        expect(club1.adminsCount - club0.adminsCount).toEqual(1)
        const reputation1 = club1.adminReputations.find(
            (i) => i.accountId === userId1
        )
        expect(reputation1).toBeDefined()
        const reputationId1 = reputation1.reputationId.toString()
        expect(
            club1.reputations.find((i) => i.reputationId === reputationId1)
        ).toBeDefined()
        const reputationObj = await Reputation.findById(
            reputation1.reputationId
        )
        expect(reputationObj.admin).toBeTruthy()
        await acceptInvite(1, `${code1}gty`, httpStatus.CONFLICT)
        await acceptInvite(1, code1, httpStatus.CONFLICT)
        await acceptInvite(1, code20, httpStatus.CONFLICT)
        await acceptInvite(1, undefined, httpStatus.BAD_REQUEST)
        await acceptInvite(2, code20, httpStatus.CONFLICT)

        const code2 = await createInvite('1')
        expect(code2).toBeDefined()
        await acceptInvite(2, code2, httpStatus.OK)

        const code3 = await createInvite('2')
        const code4 = await createInvite('2')
        const code5 = await createInvite('2')
        const code6 = await createInvite('2')
        const code7 = await createInvite('2')
        const code8 = await createInvite('2')
        const code9 = await createInvite('2')
        const code10 = await createInvite('2')

        await acceptInvite(3, code3, httpStatus.OK)
        await acceptInvite(4, code4, httpStatus.OK)
        await acceptInvite(5, code5, httpStatus.OK)
        await acceptInvite(6, code6, httpStatus.OK)
        await acceptInvite(7, code7, httpStatus.OK)
        await acceptInvite(8, code8, httpStatus.CONFLICT)
        await acceptInvite(9, code9, httpStatus.CONFLICT)
        await acceptInvite(10, code10, httpStatus.CONFLICT)
    })
})
