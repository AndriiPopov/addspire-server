const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Question, Answer } = require('../../../src/models')

setupTestDB()

describe('POST /api/resource/delete', () => {
    test('should return 201 and successfully delete question if data is ok and the user is admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/resource/delete')
            .set('accountId', 'f_0')
            .send({
                resourceId: questionId,
                clubId,
                type: 'question',
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()
        expect(question).toBeNull()

        const club = await Club.findById(clubId).lean()

        expect(club).toBeDefined()

        expect(oldClub.questions).toContain(questionId)
        expect(club.questions).not.toContain(questionId)

        expect(oldClub.questionsCount - club.questionsCount).toEqual(1)
    })
    test('should return 201 and successfully delete answer if data is ok and the user is admin', async () => {
        const oldAnswer = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/resource/delete')
            .set('accountId', 'f_0')
            .send({
                resourceId: answerId,
                clubId,
                type: 'answer',
                questionId,
            })
            .expect(httpStatus.OK)

        const answer = await Answer.findById(answerId).lean()
        expect(answer).toBeNull()

        const club = await Club.findById(clubId).lean()
        expect(club).toBeDefined()

        const question = await Question.findById(questionId).lean()
        expect(question).toBeDefined()

        expect(oldQuestion.answers).toContain(answerId)
        expect(question.answers).not.toContain(answerId)

        expect(oldQuestion.answersCount - question.answersCount).toEqual(1)
    })
    test('should return 400 error if validation fails', async () => {
        const oldAnswer = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/resource/delete')
            .set('accountId', 'f_0')
            .send({
                resourceId: answerId,
                type: 'answerasdsad',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/resource/delete')
            .set('accountId', 'f_2')
            .send({
                resourceId: questionId,
                type: 'question',
                clubId,
            })
            .expect(httpStatus.UNAUTHORIZED)
    })
})
