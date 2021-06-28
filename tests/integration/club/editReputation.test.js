const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Tag, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/club/edit-reputation', () => {
    test('should return 200 and successfully edit reputation', async () => {
        const oldUser = await Account.findOne({ facebookProfile: 'f_0' })

        const { reputationId } = oldUser.reputations[0]
        const oldReputationObj = await Reputation.findById(reputationId).lean()
        expect(oldReputationObj).not.toBeNull()

        await request(app)
            .post('/api/club/edit-reputation')
            .set('accountId', 'f_0')
            .send({
                reputationId,
                tags: ['happy', 'mate'],
                description: 'Super pro is ready!',
            })
            .expect(httpStatus.OK)

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).not.toBeNull()

        expect(reputationObj.tags).toEqual(['happy', 'mate'])
        expect(reputationObj.description).toEqual('Super pro is ready!')

        expect(reputationObj.tags).not.toEqual(oldReputationObj.tags)
        expect(reputationObj.description).not.toEqual(
            oldReputationObj.description
        )
    })

    test('should return 400 error if  validation fails except for tags. They can be empty', async () => {
        const oldUser = await Account.findOne({ facebookProfile: 'f_0' })

        const { reputationId } = oldUser.reputations[0]
        const oldReputationObj = await Reputation.findById(reputationId).lean()

        expect(oldReputationObj).not.toBeNull()
        await request(app)
            .post('/api/club/edit-reputation')
            .set('accountId', 'f_0')
            .send({
                tags: ['happy', 'mate'],
                description: 'Super pro is ready!',
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/club/edit-reputation')
            .set('accountId', 'f_0')
            .send({
                reputationId,

                description: 'Super pro is ready!',
            })
            .expect(httpStatus.OK)

        await request(app)
            .post('/api/club/edit-reputation')
            .set('accountId', 'f_0')
            .send({
                reputationId,
                tags: ['happy', 'mate'],
                description: 's ready!',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
