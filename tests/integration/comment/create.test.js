const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Comment, Question, Answer } = require('../../../src/models')

setupTestDB()

describe('POST /api/comment/create', () => {
    test('should return 201 and successfully create new comment to question if data is ok', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: '5' })
        const userId = oldUser._id.toString()

        await request(app)
            .post('/api/comment/create')
            .set('accountId', '5')
            .send({
                text: 'This is a very nice article!',
                resourceId: questionId,
                resourceType: 'question',
                bookmark: true,
            })
            .expect(httpStatus.OK)

        const comment = await Comment.findOne({
            text: 'This is a very nice article!',
        }).lean()
        const commentId = comment._id.toString()

        const user = await Account.findById(userId).lean()
        expect(oldUser.followingQuestions).not.toContain(questionId)
        expect(user.followingQuestions).toContain(questionId)

        const question = await Question.findById(questionId).lean()

        expect(oldQuestion.comments).not.toContain(commentId)
        expect(question.comments).toContain(commentId)
        expect(question.commentsCount - oldQuestion.commentsCount).toEqual(1)

        expect(oldQuestion.followers).not.toContain(userId)
        expect(question.followers).toContain(userId)
        expect(question.followersCount - oldQuestion.followersCount).toEqual(1)
    })

    test('should not add to following question if bookmark is not true', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: '5' })
        const userId = oldUser._id.toString()

        await request(app)
            .post('/api/comment/create')
            .set('accountId', '5')
            .send({
                text: 'This is a very nice article!',
                resourceId: questionId,
                resourceType: 'question',
            })
            .expect(httpStatus.OK)

        const user = await Account.findById(userId).lean()
        expect(oldUser.followingQuestions).not.toContain(questionId)
        expect(user.followingQuestions).not.toContain(questionId)

        const question = await Question.findById(questionId).lean()

        expect(oldQuestion.followers).not.toContain(userId)
        expect(question.followers).not.toContain(userId)
        expect(question.followersCount - oldQuestion.followersCount).toEqual(0)
    })

    test('should return 201 and successfully create new comment to answer if data is ok', async () => {
        const oldAnswer = await Answer.findOne({}).lean()
        const answerId = oldAnswer._id.toString()

        const oldQuestion = await Question.findOne({
            _id: oldAnswer.question,
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: '5' })
        const userId = oldUser._id.toString()

        await request(app)
            .post('/api/comment/create')
            .set('accountId', '5')
            .send({
                text: 'This is a very nice answer!',
                resourceId: answerId,
                resourceType: 'answer',
                bookmark: true,
            })
            .expect(httpStatus.OK)

        const comment = await Comment.findOne({
            text: 'This is a very nice answer!',
        }).lean()
        const commentId = comment._id.toString()

        const user = await Account.findById(userId).lean()
        expect(oldUser.followingQuestions).not.toContain(questionId)
        expect(user.followingQuestions).toContain(questionId)

        const answer = await Answer.findById(answerId).lean()

        expect(oldAnswer.comments).not.toContain(commentId)
        expect(answer.comments).toContain(commentId)
        expect(answer.commentsCount - oldAnswer.commentsCount).toEqual(1)

        const question = await Question.findById(questionId).lean()

        expect(oldQuestion.followers).not.toContain(userId)
        expect(question.followers).toContain(userId)
        expect(question.followersCount - oldQuestion.followersCount).toEqual(1)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldAnswer = await Answer.findOne({}).lean()
        const answerId = oldAnswer._id.toString()

        await request(app)
            .post('/api/comment/create')
            .set('accountId', '2')
            .send({
                resourceId: answerId,
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
