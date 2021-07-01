const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Tag, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/edit', () => {
    test('should return 200 and successfully edit account', async () => {
        const oldUser = await Account.findOne({ facebookProfile: 'f_0' })
        const userId = oldUser._id.toString()

        const oldTags = await Tag.find({})

        await request(app)
            .post('/api/account/edit')
            .set('accountId', 'f_0')
            .send({
                name: 'Test Tester',
            })
            .expect(httpStatus.OK)

        const user1 = await Account.findById(userId).lean()
        expect(user1).not.toBeNull()

        expect(oldUser.name).not.toEqual(user1.name)
        expect(user1.name).toEqual('Test Tester')

        const oldReputation = await Reputation.findOne({ owner: userId }).lean()
        const reputationId = oldReputation._id.toString()

        expect(oldReputation).not.toBeNull()
        expect(oldReputation.name).not.toEqual('Test Tester1')
        expect(oldReputation.image).not.toEqual('testImage.jpeg')
        expect(oldReputation.profileTags).not.toEqual(['tag1', 'newTagTester'])

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

        const user2 = await Account.findById(userId).lean()
        expect(user2).not.toBeNull()

        expect(user2.name).toEqual('Test Tester1')
        expect(user2.description).toEqual('description test')
        expect(user2.contact).toEqual('Contact test 1')
        expect(user2.image).toEqual('testImage.jpeg')
        expect(user2.tags).toEqual(['tag1', 'newTagTester'])

        const tags = await Tag.find({})

        expect(tags.find((i) => i._id === 'newTagTester')).toBeDefined()
        expect(oldTags.find((i) => i._id === 'newTagTester')).not.toBeDefined()

        expect(tags.find((i) => i._id === 'tag1')).toBeDefined()
        expect(oldTags.find((i) => i._id === 'tag1')).toBeDefined()

        const reputation = await Reputation.findById(reputationId).lean()

        expect(reputation).not.toBeNull()
        expect(reputation.name).toEqual('Test Tester1')
        expect(reputation.image).toEqual('testImage.jpeg')
        expect(reputation.profileTags).toEqual(['tag1', 'newTagTester'])
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/account/edit')
            .set('accountId', 'f_0')
            .send({
                name: 'T',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
