const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/save-notification-token', () => {
    test('should save push token', async () => {
        const oldAccount = await Account.findOne({ facebookProfile: 'f_1' })
        const accountId = oldAccount._id.toString()

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_1')
            .send({ token: '12345' })
            .expect(httpStatus.OK)

        const account1 = await Account.findById(accountId).lean()
        expect(account1.expoTokens).toEqual(['12345'])

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_1')
            .send({ token: '12345' })
            .expect(httpStatus.OK)

        const account2 = await Account.findById(accountId).lean()
        expect(account2.expoTokens).toEqual(['12345'])

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_1')
            .send({ token: '123456' })
            .expect(httpStatus.OK)

        const account3 = await Account.findById(accountId).lean()
        expect(account3.expoTokens).toEqual(['12345', '123456'])
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_1')
            .send({ token: 123456 })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_1')
            .send({})
            .expect(httpStatus.BAD_REQUEST)
    })
})
