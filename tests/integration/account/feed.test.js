const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/seen-feed', () => {
    test('should mark feed as seen', async () => {
        const oldAccount = await Account.findOne({ facebookProfile: 'f_1' })
        const accountId = oldAccount._id.toString()

        await Account.updateOne(
            { _id: accountId },
            {
                $set: {
                    feed: [
                        {
                            notId: '0',
                        },
                        {
                            notId: '1',
                        },

                        {
                            notId: '2',
                        },
                    ],
                },
            }
        )

        await request(app)
            .post('/api/account/seen-feed')
            .set('accountId', 'f_1')
            .expect(httpStatus.OK)

        const account1 = await Account.findById(accountId).lean()
        expect(account1.feed.length).toEqual(3)
        expect(account1.feed[0].seen).toBeTruthy()
        expect(account1.feed[1].seen).toBeTruthy()
        expect(account1.feed[2].seen).toBeTruthy()

        await request(app)
            .post('/api/account/seen-feed')
            .set('accountId', 'f_1')
            .expect(httpStatus.OK)
    })
})
