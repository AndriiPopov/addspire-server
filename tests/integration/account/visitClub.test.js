const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account } = require('../../../src/models')
const mongoose = require('mongoose')

setupTestDB()

describe('POST /api/account/visit-club', () => {
    test('should save clubId to lastClubVisits and topClubVisits', async () => {
        const oldAccount1 = await Account.findOne({ facebookProfile: '1' })
        const accountId1 = oldAccount1._id.toString()

        const clubId0 = mongoose.Types.ObjectId()
        await request(app)
            .post('/api/account/visit-club')
            .set('accountId', '1')
            .send({ id: clubId0 })
            .expect(httpStatus.OK)

        const account1 = await Account.findById(accountId1).lean()
        expect(account1.lastClubVisits).toEqual([clubId0.toString()])
        expect(account1.topClubVisits).toEqual([clubId0.toString()])

        await request(app)
            .post('/api/account/visit-club')
            .set('accountId', '1')
            .send({ id: clubId0 })
            .expect(httpStatus.OK)

        const account2 = await Account.findById(accountId1).lean()
        expect(account2.lastClubVisits).toEqual([clubId0.toString()])
        expect(account2.topClubVisits).toEqual([
            clubId0.toString(),
            clubId0.toString(),
        ])

        const clubId1 = mongoose.Types.ObjectId()
        await request(app)
            .post('/api/account/visit-club')
            .set('accountId', '1')
            .send({ id: clubId1 })
            .expect(httpStatus.OK)

        const account3 = await Account.findById(accountId1).lean()
        expect(account3.lastClubVisits).toEqual([
            clubId1.toString(),
            clubId0.toString(),
        ])
        expect(account3.topClubVisits).toEqual([
            clubId1.toString(),
            clubId0.toString(),
            clubId0.toString(),
        ])
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/account/visit-club')
            .set('accountId', '1')
            .send({})
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/account/save-notification-token')
            .set('accountId', '1')
            .send({ id: 'sadasdsa' })
            .expect(httpStatus.BAD_REQUEST)
    })
})
