const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation, Resource } = require('../../../src/models')

setupTestDB()

describe('POST /api/resource/edit', () => {
    test('should return 201 and successfully edit resource if data is ok and the user is owner', async () => {
        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()
        await request(app)
            .post('/api/resource/edit')
            .set('accountId', 'f_0')
            .send({
                resourceId: questionId,
                clubId,
                name: 'Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
            })
            .expect(httpStatus.OK)

        const question = await Resource.findById(questionId).lean()

        expect(question).toBeDefined()

        expect(question.name).toEqual('Test value?')
        expect(question.description).toEqual('Test description.')
        expect(question.images).toEqual(['test3.jpg', 'test4.jpg'])
        expect(question.tags).toEqual(['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'])
    })
    test('should return 201 and successfully edit resource if data is ok and the user is admin', async () => {
        const oldQuestion = await Resource.findOne({
            name: 'Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()
        await request(app)
            .post('/api/resource/edit')
            .set('accountId', 'f_2')
            .send({
                resourceId: questionId,
                clubId,
                name: 'Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.OK)

        const question = await Resource.findById(questionId).lean()

        expect(question).toBeDefined()

        expect(question.name).toEqual('Test value?')
        expect(question.description).toEqual('Test description.')
        expect(question.images).toEqual(['test3.jpg', 'test4.jpg'])
    })
    test('should return 400 error if  validation fails', async () => {
        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({
            name: 'Test club 1',
        }).lean()
        const clubId = oldClub._id.toString()
        await request(app)
            .post('/api/resource/edit')
            .set('accountId', 'f_0')
            .send({
                clubId,
                name: 'Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.BAD_REQUEST)
        await request(app)
            .post('/api/resource/edit')
            .set('accountId', 'f_0')
            .send({
                clubId,
                resourceId: questionId,
                name: 'Test value?',
                description: 'ion.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not author and not admin', async () => {
        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({
            name: 'Test club 1',
        }).lean()
        const clubId = oldClub._id.toString()
        await request(app)
            .post('/api/resource/edit')
            .set('accountId', 'f_2')
            .send({
                clubId,
                name: 'Test value?',
                resourceId: questionId,
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.UNAUTHORIZED)
    })
})
