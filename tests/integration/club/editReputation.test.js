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

        await request(app)
            .post('/api/account/edit')
            .set('accountId', 'f_0')
            .send({
                name: 'Test Tester1',
                description: 'description test',
                contact: 'Contact test 1',
                tags: ['tag1', 'newTagTester'],
                image: 'testImage.jpeg',
            })
            .expect(httpStatus.OK)

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

        expect(reputationObj.tags).toEqual([
            'happy',
            'mate',
            'newTagTester',
            'tag1',
        ])
        expect(reputationObj.reputationTags).toEqual(['happy', 'mate'])
        expect(reputationObj.profileTags).toEqual(['tag1', 'newTagTester'])
        expect(reputationObj.description).toEqual('Super pro is ready!')
        expect(reputationObj.name).toEqual('Test Tester1')

        expect(reputationObj.tags).not.toEqual(oldReputationObj.tags)
        expect(reputationObj.description).not.toEqual(
            oldReputationObj.description
        )
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
