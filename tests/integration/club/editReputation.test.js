const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Tag, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/club/edit-reputation', () => {
    test('should return 200 and successfully edit reputation', async () => {
        const oldUser = await Account.findOne({ facebookProfile: 'f_0' }).lean()

        const oldReputationObj = await Reputation.findOne({
            owner: oldUser._id,
        }).lean()
        const reputationId = oldReputationObj._id.toString()
        expect(oldReputationObj).not.toBeNull()

        const editData = {
            description: 'desc',
            address: 'addr',
            phone: 'phone',
            web: 'webb',
            email: 'emaill',
            tags: ['happy', 'mate'],
            social: 'socials are cool',
            background: 'back.jpeg',
        }

        await request(app)
            .post('/api/club/edit-reputation')
            .set('accountId', 'f_0')
            .send({
                ...editData,
                reputationId,
            })
            .expect(httpStatus.OK)

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).not.toBeNull()

        expect(reputationObj).toMatchObject(editData)
    })

    test('should return 400 error if  validation fails except for tags. They can be empty', async () => {
        const oldUser = await Account.findOne({ facebookProfile: 'f_0' })

        const oldReputationObj = await Reputation.findOne({
            owner: oldUser._id,
        }).lean()
        const reputationId = oldReputationObj._id.toString()
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
    })
})
