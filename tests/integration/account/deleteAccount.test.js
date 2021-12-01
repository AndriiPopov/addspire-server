const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/delete', () => {
    test('should return 200 and successfully delete account one time', async () => {
        const oldUser = await Account.findOne({
            facebookProfile: '0',
        }).lean()
        const userId = oldUser._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()

        const oldReputation = await Reputation.findOne({
            club: clubId,
            owner: userId,
            admin: true,
        }).lean()
        expect(oldReputation).not.toBeNull()
        const reputationId = oldReputation._id.toString()

        await request(app)
            .post('/api/account/delete')
            .set('accountId', '0')
            .send({})
            .expect(httpStatus.OK)

        const user = await Account.findById(userId).lean()
        expect(user).toBeNull()

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).toBeNull()

        const club = await Club.findById(clubId).lean()
        expect(club).not.toBeNull()

        expect(oldClub.adminReputations).toContain(reputationId)
        expect(club.adminReputations).not.toContain(reputationId)
        expect(oldClub.adminsCount - club.adminsCount).toEqual(1)

        await request(app)
            .post('/api/account/delete')
            .set('accountId', '0')
            .send({})
            .expect(httpStatus.UNAUTHORIZED)
    })
})
