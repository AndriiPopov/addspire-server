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

describe('POST /api/club/get-reputation-id', () => {
    test(`should return 200 and reputation id`, async () => {
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
        const club = await Club.findOne({
            name: 'Rollers of USRollers of US',
        })
            .lean()
            .exec()
        const clubId = club._id.toString()

        let result = await request(app)
            .post('/api/club/get-reputation-id')
            .set('accountId', '0')
            .send({
                clubId,
            })
            .expect(httpStatus.OK)

        expect(result.body.reputationId).toBeDefined()
        const repId = result.body.reputationId

        result = await request(app)
            .post('/api/club/get-reputation-id')
            .set('accountId', '0')
            .send({
                clubId,
            })
            .expect(httpStatus.OK)

        expect(result.body.reputationId).toEqual(repId)
    })
})
