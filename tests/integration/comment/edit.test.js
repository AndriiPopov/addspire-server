const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Comment } = require('../../../src/models')

setupTestDB()

describe('POST /api/comment/edit', () => {
    test('should return 201 and successfully edit resource if data is ok and the user is owner', async () => {
        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()
        await request(app)
            .post('/api/comment/edit')
            .set('accountId', 'f_2')
            .send({
                text: 'New value long enough',
                commentId,
            })
            .expect(httpStatus.OK)

        const comment = await Comment.findById(commentId).lean()

        expect(comment).toBeDefined()

        expect(comment.author).toEqual(oldComment.author)
        expect(comment.text).toEqual('New value long enough')
    })
    test('should return 201 and successfully edit resource if data is ok and the user is admin', async () => {
        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()
        await request(app)
            .post('/api/comment/edit')
            .set('accountId', 'f_0')
            .send({
                text: 'New value long enough',
                commentId,
            })
            .expect(httpStatus.OK)

        const comment = await Comment.findById(commentId).lean()

        expect(comment).toBeDefined()

        expect(comment.author).toEqual(oldComment.author)
        expect(comment.text).toEqual('New value long enough')
    })
    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()
        await request(app)
            .post('/api/comment/edit')
            .set('accountId', 'f_0')
            .send({
                commentId,
                text: 'short',
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/comment/edit')
            .set('accountId', 'f_0')
            .send({
                clubId,
                text: 'New value long enough',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not author and not admin', async () => {
        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()
        await request(app)
            .post('/api/comment/edit')
            .set('accountId', 'f_1')
            .send({
                text: 'New value long enough',
                commentId,
            })
            .expect(httpStatus.UNAUTHORIZED)
    })
})
