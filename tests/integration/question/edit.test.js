const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Question, Count, Account, System } = require('../../../src/models')

setupTestDB()

describe('POST /api/question/edit', () => {
    test('should return 201 and successfully edit resource if data is ok and the user is owner', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '0')
            .send({
                resourceId: questionId,
                name: 'Test value?Test value?Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()

        expect(question.name).toEqual('Test value?Test value?Test value?')
        expect(question.description).toEqual('Test description.')
        expect(question.images[0].url).toEqual('test3.jpg')
        expect(question.images[1].url).toEqual('test4.jpg')
        expect(question.images.length).toEqual(2)

        expect(question.tags).toEqual(['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'])

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '0')
            .send({
                resourceId: questionId,
                name: 'Test value?Test value?Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg', 'test5.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
            })
            .expect(httpStatus.OK)

        const question1 = await Question.findById(questionId).lean()
        expect(question1.images[0]).toMatchObject(question.images[0])
        expect(question1.images[1]).toEqual(question.images[1])
        expect(question1.images[2].url).toEqual('test5.jpg')
        expect(question1.images.length).toEqual(3)
    })
    test('should return 201 and successfully edit resource if data is ok and the user is admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '2')
            .send({
                resourceId: questionId,
                name: 'Test value?Test value?Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()

        expect(question.name).toEqual('Test value?Test value?Test value?')
        expect(question.description).toEqual('Test description.')
    })

    test('should return 400 error if  validation fails', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '0')
            .send({
                name: 'Test value?Test value?Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
            })
            .expect(httpStatus.BAD_REQUEST)
        await request(app)
            .post('/api/question/edit')
            .set('accountId', '0')
            .send({
                resourceId: questionId,
                name: 'Test value?',
                description: 'ion.',
                images: ['test3.jpg', 'test4.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
            })
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not author and not admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '2')
            .send({
                name: 'Test value?Test value?Test value?',
                resourceId: questionId,
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
            })
            .expect(httpStatus.UNAUTHORIZED)
    })
})
