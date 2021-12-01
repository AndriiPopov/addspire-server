const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Question, Answer, Count } = require('../../../src/models')
const value = require('../../../src/config/value')

setupTestDB()

describe('POST /api/answer/delete', () => {
    test('should return 201 and successfully delete answer if data is ok and the user is admin', async () => {
        const oldAnswer = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldQuestion = await Question.findById(oldAnswer.question).lean()

        await request(app)
            .post('/api/answer/delete')
            .set('accountId', '0')
            .send({
                resourceId: answerId,
            })
            .expect(httpStatus.OK)

        const answer = await Answer.findById(answerId).lean()
        expect(answer).toBeNull()

        const question = await Question.findById(oldAnswer.question).lean()
        expect(oldQuestion.answersCount - question.answersCount).toEqual(1)
    })
    test('should return 400 error if validation fails', async () => {
        await request(app)
            .post('/api/answer/delete')
            .set('accountId', '0')
            .send({
                resourceId: 'sdfsdfs',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not admin', async () => {
        const oldAnswer = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId = oldAnswer._id.toString()

        await request(app)
            .post('/api/answer/delete')
            .set('accountId', '2')
            .send({
                resourceId: answerId,
            })
            .expect(httpStatus.UNAUTHORIZED)
    })

    test('should delete reputation from count', async () => {
        const oldAnswer = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldQuestion = await Question.findById(oldAnswer.question).lean()

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '5')
            .send({
                resourceId: answerId,
                type: 'answer',
            })
            .expect(httpStatus.OK)

        const countId = oldQuestion.count
        const count = await Count.findById(countId).lean()
        expect(count.reputationDestribution).toMatchObject({
            [oldAnswer.owner]: value.plusResource,
        })

        await request(app)
            .post('/api/answer/delete')
            .set('accountId', '0')
            .send({
                resourceId: answerId,
            })
            .expect(httpStatus.OK)

        const newCount = await Count.findById(countId).lean()
        expect(newCount.reputationDestribution).toMatchObject({
            [oldAnswer.owner]: 0,
        })
    })
})
