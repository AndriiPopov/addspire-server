const request = require('supertest')
const httpStatus = require('http-status')
const mongoose = require('mongoose')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/seen-feed', () => {
    test('should mark feed entries as seen for one question', async () => {
        const oldAccount = await Account.findOne({ facebookProfile: 'f_1' })
        const accountId = oldAccount._id.toString()

        const questionId0 = new mongoose.Types.ObjectId()
        const questionId1 = new mongoose.Types.ObjectId()
        const questionId2 = new mongoose.Types.ObjectId()
        const questionId3 = new mongoose.Types.ObjectId()
        const questionId4 = new mongoose.Types.ObjectId()

        await Account.updateOne(
            { _id: accountId },
            {
                $set: {
                    feed: [
                        {
                            notId: '0',
                            questionId: questionId0,
                            details: {},
                            seen: false,
                        },
                        {
                            notId: '1',
                            questionId: questionId1,
                            details: {},
                            seen: false,
                        },

                        {
                            notId: '2',
                            questionId: questionId2,
                            details: {},
                            seen: false,
                        },
                        {
                            notId: '3',
                            questionId: questionId3,
                            details: {},
                            seen: false,
                        },
                        {
                            notId: '4',
                            questionId: questionId4,
                            details: {},
                            seen: false,
                        },
                        {
                            notId: '5',
                            questionId: questionId0,
                            details: {},
                            seen: false,
                        },
                        {
                            notId: '6',
                            questionId: questionId0,
                            details: {},
                            seen: false,
                        },
                        {
                            notId: '7',
                            questionId: questionId1,
                            details: {},
                            seen: false,
                        },
                    ],
                },
            }
        )

        await request(app)
            .post('/api/account/seen-feed')
            .set('accountId', 'f_1')
            .send({ id: questionId0 })
            .expect(httpStatus.OK)

        const account1 = await Account.findById(accountId).lean()
        expect(account1.feed).toMatchObject([
            {
                notId: '0',
                questionId: questionId0.toString(),
                details: {},
                seen: true,
            },
            {
                notId: '1',
                questionId: questionId1.toString(),
                details: {},
                seen: false,
            },

            {
                notId: '2',
                questionId: questionId2.toString(),
                details: {},
                seen: false,
            },
            {
                notId: '3',
                questionId: questionId3.toString(),
                details: {},
                seen: false,
            },
            {
                notId: '4',
                questionId: questionId4.toString(),
                details: {},
                seen: false,
            },
            {
                notId: '5',
                questionId: questionId0.toString(),
                details: {},
                seen: true,
            },
            {
                notId: '6',
                questionId: questionId0.toString(),
                details: {},
                seen: true,
            },
            {
                notId: '7',
                questionId: questionId1.toString(),
                details: {},
                seen: false,
            },
        ])

        await request(app)
            .post('/api/account/seen-feed')
            .set('accountId', 'f_1')
            .send({ id: questionId0 })
            .expect(httpStatus.OK)
    })
})
