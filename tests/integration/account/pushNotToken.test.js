const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/save-notification-token and /api/account/remove-notification-token', () => {
    test('should save push token', async () => {
        const oldAccount1 = await Account.findOne({ facebookProfile: 'f_1' })
        const accountId1 = oldAccount1._id.toString()

        const oldAccount2 = await Account.findOne({ facebookProfile: 'f_2' })
        const accountId2 = oldAccount2._id.toString()

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_1')
            .send({ token: '12345' })
            .expect(httpStatus.OK)

        const account1 = await Account.findById(accountId1).lean()
        expect(account1.expoTokens).toEqual(['12345'])

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_1')
            .send({ token: '12345' })
            .expect(httpStatus.OK)

        const account2 = await Account.findById(accountId1).lean()
        expect(account2.expoTokens).toEqual(['12345'])

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_1')
            .send({ token: '123456' })
            .expect(httpStatus.OK)

        const account3 = await Account.findById(accountId1).lean()
        expect(account3.expoTokens).toEqual(['12345', '123456'])

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_2')
            .send({ token: '12345' })
            .expect(httpStatus.OK)

        const account4 = await Account.findById(accountId1).lean()
        expect(account4.expoTokens).toEqual(['123456'])
        const account5 = await Account.findById(accountId2).lean()
        expect(account5.expoTokens).toEqual(['12345'])

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', 'f_1')
            .send({ token: '1234567' })
            .expect(httpStatus.OK)

        await request(app)
            .post('/api/account/remove-notification-token')
            .send({ token: '123456' })
            .expect(httpStatus.OK)

        const account6 = await Account.findById(accountId1).lean()
        expect(account6.expoTokens).toEqual(['1234567'])
        const account7 = await Account.findById(accountId2).lean()
        expect(account7.expoTokens).toEqual(['12345'])
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
