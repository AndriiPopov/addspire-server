const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Comment } = require('../../../src/models')

setupTestDB()

describe('POST /api/document/get', () => {
    test('should return 200 and return needed resources', async () => {
        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()
        const res = await request(app)
            .post('/api/document/get')
            .send({
                type: 'comment',
                ids: [commentId],
            })
            .expect(httpStatus.OK)

        expect(res.body.type).toEqual('comment')
        expect(res.body.messageCode).toEqual('addResource')
        expect(res.body.resources[0]._id).toEqual(commentId)
    })

    test('should return 200 and return not found', async () => {
        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()
        const res = await request(app)
            .post('/api/document/get')
            .send({
                type: 'answer',
                ids: [commentId],
            })
            .expect(httpStatus.OK)

        expect(res.body.messageCode).toEqual('notFoundResource')
        expect(res.body._id).toEqual([commentId])
    })

    test('should return 401 error if validation fails', async () => {
        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()
        await request(app)
            .post('/api/document/get')
            .send({
                type: 'notcom',
                ids: [commentId],
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/document/get')
            .send({
                type: 'comment',
                ids: [1],
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/document/get')
            .send()
            .expect(httpStatus.BAD_REQUEST)
    })
})
