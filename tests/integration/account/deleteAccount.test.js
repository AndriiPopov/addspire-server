const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/delete', () => {
    test('should return 200 and successfully delete account one time', async () => {
        const oldUser = await Account.findOne({
            facebookProfile: 'f_0',
        }).lean()
        const userId = oldUser._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()

        const oldReputation = oldUser.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputation).toBeDefined()
        const { reputationId } = oldReputation
        const oldReputationObj = await Reputation.findById(reputationId)
        expect(oldReputationObj).toBeDefined()

        await request(app)
            .post('/api/account/delete')
            .set('accountId', 'f_0')
            .send({})
            .expect(httpStatus.OK)

        const user = await Account.findById(userId).lean()
        expect(user).toBeNull()

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).toBeNull()

        const club = await Club.findById(clubId).lean()
        expect(club).not.toBeNull()

        expect(club.reputationsCount - oldClub.reputationsCount).toEqual(-1)
        expect(
            oldClub.reputations.find((i) => i.reputationId === reputationId)
        ).toBeDefined()
        expect(
            oldClub.adminReputations.find(
                (i) => i.reputationId === reputationId
            )
        ).toBeDefined()
        expect(
            club.reputations.find((i) => i.reputationId === reputationId)
        ).not.toBeDefined()
        expect(
            club.adminReputations.find((i) => i.reputationId === reputationId)
        ).not.toBeDefined()
        await request(app)
            .post('/api/account/delete')
            .set('accountId', 'f_0')
            .send({})
            .expect(httpStatus.UNAUTHORIZED)
    })
})
