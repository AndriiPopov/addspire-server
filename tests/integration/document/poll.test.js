// const request = require('supertest')
// const httpStatus = require('http-status')
// const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Comment } = require('../../../src/models')
const validate = require('../../../src/middlewares/validate')
const { documentValidation } = require('../../../src/validations')

setupTestDB()
const validationFunction = validate(documentValidation.pollDocument)

describe('POST /api/document/poll', () => {
    test('should return 200 and return needed resources', async () => {
        const oldComment = await Comment.findOne({
            text: 'Test comment',
        }).lean()
        const commentId = oldComment._id.toString()
        // await request(app)
        //     .post('/api/document/poll')
        //     .send
        //     //     {
        //     //     pollResources: {
        //     //         resources: {
        //     //             comment: { [commentId]: -1 },
        //     //         },
        //     //     },
        //     // }
        //     ()
        //     .expect(httpStatus.BAD_REQUEST)

        // expect(res.body.type).toEqual('comment')
        // expect(res.body.messageCode).toEqual('addResource')
        // expect(res.body.resources[0]._id).toEqual(commentId)

        const next = jest.fn()
        validationFunction({ body: {} }, {}, next)
        expect(next).not.toHaveBeenLastCalledWith()

        validationFunction({ body: { pollResources: {} } }, {}, next)
        expect(next).not.toHaveBeenLastCalledWith()

        validationFunction(
            {
                body: {
                    pollResources: { resources: {}, locales: [] },
                },
            },
            {},
            next
        )
        expect(next).not.toHaveBeenLastCalledWith()

        validationFunction(
            {
                body: {
                    pollResources: { resources: {}, locales: [['en', '1']] },
                },
            },
            {},
            next
        )
        expect(next).toHaveBeenLastCalledWith()

        validationFunction(
            {
                body: {
                    pollResources: { resources: {}, locales: [['en', 1]] },
                },
            },
            {},
            next
        )
        expect(next).toHaveBeenLastCalledWith()

        validationFunction(
            {
                body: {
                    pollResources: { resources: {}, locales: [['en', {}]] },
                },
            },
            {},
            next
        )
        expect(next).not.toHaveBeenLastCalledWith()

        validationFunction(
            {
                body: {
                    pollResources: {
                        resources: { assas: {} },
                        locales: [['en', 1]],
                    },
                },
            },
            {},
            next
        )
        expect(next).not.toHaveBeenLastCalledWith()

        validationFunction(
            {
                body: {
                    pollResources: {
                        resources: { comment: {} },
                        locales: [['en', 1]],
                    },
                },
            },
            {},
            next
        )
        expect(next).toHaveBeenLastCalledWith()

        validationFunction(
            {
                body: {
                    pollResources: {
                        resources: { comment: { asdsad: 1 } },
                        locales: [['en', 1]],
                    },
                },
            },
            {},
            next
        )
        expect(next).not.toHaveBeenLastCalledWith()

        validationFunction(
            {
                body: {
                    pollResources: {
                        resources: { comment: { [commentId]: 1 } },
                        locales: [['en', 1]],
                    },
                },
            },
            {},
            next
        )
        expect(next).toHaveBeenLastCalledWith()

        validationFunction(
            {
                body: {
                    pollResources: {
                        resources: { comment: { [commentId]: {} } },
                        locales: [['en', 1]],
                    },
                },
            },
            {},
            next
        )
        expect(next).not.toHaveBeenLastCalledWith()
    })

    // test('should return 401 error if validation fails', async () => {
    //     const oldComment = await Comment.findOne({
    //         text: 'Test comment',
    //     }).lean()
    //     const commentId = oldComment._id.toString()
    //     await request(app)
    //         .post('/api/document/get')
    //         .send({
    //             type: 'notcom',
    //             ids: [commentId],
    //         })
    //         .expect(httpStatus.BAD_REQUEST)

    //     await request(app)
    //         .post('/api/document/get')
    //         .send({
    //             type: 'comment',
    //             ids: [1],
    //         })
    //         .expect(httpStatus.BAD_REQUEST)

    //     await request(app)
    //         .post('/api/document/get')
    //         .send()
    //         .expect(httpStatus.BAD_REQUEST)
    // })
})
