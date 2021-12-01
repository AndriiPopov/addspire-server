const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Answer } = require('../../../src/models')

setupTestDB()

describe('POST /api/answer/edit', () => {
    test('should return 201 and successfully edit resource if data is ok and the user is owner', async () => {
        const oldAnswer = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId = oldAnswer._id.toString()

        await request(app)
            .post('/api/answer/edit')
            .set('accountId', '0')
            .send({
                resourceId: answerId,
                description: 'Test description for answer2.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.OK)

        const answer = await Answer.findById(answerId).lean()

        expect(answer).toBeDefined()

        expect(answer.description).toEqual('Test description for answer2.')
        expect(answer.images).toEqual(['test3.jpg', 'test4.jpg'])
    })
    test('should return 201 and successfully edit resource if data is ok and the user is admin', async () => {
        const oldAnswer = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId = oldAnswer._id.toString()

        await request(app)
            .post('/api/answer/edit')
            .set('accountId', '3')
            .send({
                resourceId: answerId,
                description: 'Test description for answer2.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.OK)

        const answer = await Answer.findById(answerId).lean()

        expect(answer).toBeDefined()

        expect(answer.description).toEqual('Test description for answer2.')
        expect(answer.images).toEqual(['test3.jpg', 'test4.jpg'])
    })
    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/answer/edit')
            .set('accountId', '0')
            .send({
                description: 'Test description for answer2.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not author and not admin', async () => {
        const oldAnswer = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId = oldAnswer._id.toString()

        await request(app)
            .post('/api/answer/edit')
            .set('accountId', '2')
            .send({
                resourceId: answerId,
                description: 'Test description for answer2.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.UNAUTHORIZED)
    })
})
