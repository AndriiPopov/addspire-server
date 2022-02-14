const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Question, Account, System } = require('../../../src/models')

setupTestDB()

describe('POST /api/question/delete', () => {
    test('should return 201 and successfully delete question if data is ok and the user is admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/question/delete')
            .set('accountId', '0')
            .send({
                resourceId: questionId,
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()
        expect(question).toBeNull()

        const club = await Club.findById(clubId).lean()

        expect(oldClub.questionsCount - club.questionsCount).toEqual(1)
    })

    test('should return 400 error if validation fails', async () => {
        await request(app)
            .post('/api/question/delete')
            .set('accountId', '0')
            .send({})
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/delete')
            .set('accountId', '2')
            .send({
                resourceId: questionId,
            })
            .expect(httpStatus.UNAUTHORIZED)
    })
})
