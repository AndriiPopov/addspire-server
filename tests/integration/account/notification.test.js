const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/seen-notification', () => {
    test('should mark notification as seen, if all, mark all as seen', async () => {
        const oldAccount = await Account.findOne({ facebookProfile: '1' })
        const accountId = oldAccount._id.toString()

        await Account.updateOne(
            { _id: accountId },
            {
                $set: {
                    notifications: [
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
            .post('/api/account/seen-notification')
            .set('accountId', '1')
            .send({
                notId: '1',
            })
            .expect(httpStatus.OK)

        const account1 = await Account.findById(accountId).lean()
        expect(account1.notifications.length).toEqual(3)
        expect(account1.notifications[0].seen).toBeFalsy()
        expect(account1.notifications[1].seen).toBeTruthy()
        expect(account1.notifications[2].seen).toBeFalsy()

        await request(app)
            .post('/api/account/seen-notification')
            .set('accountId', '1')
            .send({
                notId: 'all',
            })
            .expect(httpStatus.OK)

        const account2 = await Account.findById(accountId).lean()
        expect(account2.notifications.length).toEqual(3)
        expect(account2.notifications[0].seen).toBeTruthy()
        expect(account2.notifications[1].seen).toBeTruthy()
        expect(account2.notifications[2].seen).toBeTruthy()

        await request(app)
            .post('/api/account/seen-notification')
            .set('accountId', '1')
            .send({
                notId: '1',
            })
            .expect(httpStatus.OK)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldAccount = await Account.findOne({ facebookProfile: '1' })
        const accountId = oldAccount._id.toString()

        await Account.updateOne(
            { _id: accountId },
            {
                $set: {
                    notifications: [
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
            .post('/api/account/seen-notification')
            .set('accountId', '1')
            .send({})
            .expect(httpStatus.BAD_REQUEST)
    })
})
