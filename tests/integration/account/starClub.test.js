const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Club, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/star-club', () => {
    test('should add a club to starred, not allow to star it again, unstar it and not allow to unstar it again', async () => {
        const oldAccount = await Account.findOne({ facebookProfile: 'f_1' })
        const accountId = oldAccount._id.toString()

        const oldClub = await Club.findOne({})
        const clubId = oldClub._id.toString()

        const oldReputation = await Reputation.findOne({
            owner: accountId,
            club: clubId,
        }).lean()

        const reputationId = oldReputation._id.toString()

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
                add: true,
            })
            .expect(httpStatus.OK)

        const reputation1 = await Reputation.findById(reputationId).lean()
        expect(oldReputation.starred).toBeFalsy()
        expect(reputation1.starred).toBeTruthy()

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
                add: true,
            })
            .expect(httpStatus.OK)

        const reputation2 = await Reputation.findById(reputationId).lean()
        expect(reputation2.starred).toBeTruthy()

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
                add: false,
            })
            .expect(httpStatus.OK)

        const reputation3 = await Reputation.findById(reputationId).lean()
        expect(reputation3.starred).toBeFalsy()

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
                add: false,
            })
            .expect(httpStatus.OK)

        const reputation4 = await Reputation.findById(reputationId).lean()
        expect(reputation4.starred).toBeFalsy()
    })

    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({})
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                add: true,
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
