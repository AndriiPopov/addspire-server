const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Comment, Question, Count } = require('../../../src/models')
const value = require('../../../src/config/value')

setupTestDB()

describe('POST /api/comment/delete', () => {
    test('should return 201 and successfully delete comment if data is ok and the user is author', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()

        await request(app)
            .post('/api/comment/delete')
            .set('accountId', 'f_2')
            .send({
                commentId,
            })
            .expect(httpStatus.OK)

        const comment = await Comment.findById(commentId).lean()
        expect(comment).toBeNull()

        const question = await Question.findById(questionId).lean()

        expect(oldQuestion.comments).toContain(commentId)
        expect(question.comments).not.toContain(commentId)
        expect(question.commentsCount - oldQuestion.commentsCount).toEqual(-1)

        expect(question.followersCount).toEqual(oldQuestion.followersCount)
    })
    test('should return 201 and successfully delete comment if data is ok and the user is admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()

        await request(app)
            .post('/api/comment/delete')
            .set('accountId', 'f_0')
            .send({
                commentId,
            })
            .expect(httpStatus.OK)

        const comment = await Comment.findById(commentId).lean()
        expect(comment).toBeNull()

        const question = await Question.findById(questionId).lean()

        expect(oldQuestion.comments).toContain(commentId)
        expect(question.comments).not.toContain(commentId)
        expect(question.commentsCount - oldQuestion.commentsCount).toEqual(-1)

        expect(question.followersCount).toEqual(oldQuestion.followersCount)
    })
    test('should return 400 error if validation fails', async () => {
        await request(app)
            .post('/api/comment/delete')
            .set('accountId', 'f_2')
            .send({})
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not admin', async () => {
        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()

        await request(app)
            .post('/api/comment/delete')
            .set('accountId', 'f_1')
            .send({
                commentId,
            })
            .expect(httpStatus.UNAUTHORIZED)
    })

    test('should delete reputation from count', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()

        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', 'f_5')
            .send({
                resourceId: commentId,
                type: 'comment',
            })
            .expect(httpStatus.OK)

        const countId = oldQuestion.count
        const count = await Count.findById(countId).lean()
        expect(count.reputationDestribution).toMatchObject({
            [oldComment.owner]: value.plusComment,
        })

        await request(app)
            .post('/api/comment/delete')
            .set('accountId', 'f_0')
            .send({
                commentId,
            })
            .expect(httpStatus.OK)

        const newCount = await Count.findById(countId).lean()
        expect(newCount.reputationDestribution).toMatchObject({
            [oldComment.owner]: 0,
        })
    })
})
