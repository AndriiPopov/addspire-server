const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Tag, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/edit', () => {
    test('should return 200 and successfully edit account', async () => {
        const oldUser = await Account.findOne({ facebookProfile: '0' })
        const userId = oldUser._id.toString()

        const oldTags = await Tag.find({})

        await request(app)
            .post('/api/account/edit')
            .set('accountId', '0')
            .send({
                name: 'Test Tester',
                image: 'image.png',
            })
            .expect(httpStatus.OK)

        const user1 = await Account.findById(userId).lean()
        expect(user1).not.toBeNull()

        expect(oldUser.name).not.toEqual(user1.name)
        expect(user1.name).toEqual('Test Tester')
        expect(user1.image).toEqual('image.png')

        const oldReputation = await Reputation.findOne({ owner: userId }).lean()
        const reputationId = oldReputation._id.toString()

        expect(oldReputation).not.toBeNull()
        expect(oldReputation.name).not.toEqual('Test Tester1')
        expect(oldReputation.profileTags).not.toEqual(['tag1', 'newTagTester'])

        await request(app)
            .post('/api/club/edit-reputation')
            .set('accountId', '0')
            .send({
                reputationId,
                tags: ['happy', 'mate'],
                description: 'Super pro is ready!',
            })
            .expect(httpStatus.OK)

        const editData = {
            name: 'Test Tester1',
            description: 'desc',
            address: 'addr',
            phone: 'phone',
            web: 'webb',
            email: 'emaill',
            tags: ['tag1', 'newTagTester'],
            image: 'testImage.jpeg',
            background: 'back.jpeg',
            social: 'socials are cool',
        }

        await request(app)
            .post('/api/account/edit')
            .set('accountId', '0')
            .send(editData)
            .expect(httpStatus.OK)

        const user2 = await Account.findById(userId).lean()
        expect(user2).not.toBeNull()

        expect(user2).toMatchObject(editData)

        const tags = await Tag.find({})

        expect(tags.find((i) => i._id === 'newTagTester')).toBeDefined()
        expect(oldTags.find((i) => i._id === 'newTagTester')).not.toBeDefined()

        expect(tags.find((i) => i._id === 'tag1')).toBeDefined()
        expect(oldTags.find((i) => i._id === 'tag1')).toBeDefined()

        const reputation = await Reputation.findById(reputationId).lean()

        expect(reputation).toMatchObject({
            name: 'Test Tester1',
            profileDescription: 'desc',
            profileAddress: 'addr',
            profilePhone: 'phone',
            profileWeb: 'webb',
            profileEmail: 'emaill',
            profileTags: ['tag1', 'newTagTester'],
            profileBackground: 'back.jpeg',
            profileSocial: 'socials are cool',
            tags: ['happy', 'mate'],
        })
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/account/edit')
            .set('accountId', '0')
            .send({
                name: 'T',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
