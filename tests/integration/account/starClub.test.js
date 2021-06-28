const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Club } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/star-club', () => {
    test('should add a club to starred, not allow to star it again, unstar it and not allow to unstar it again', async () => {
        const oldAccount = await Account.findOne({ facebookProfile: 'f_1' })
        const accountId = oldAccount._id.toString()

        const oldClub = await Club.findOne({})
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
                add: true,
            })
            .expect(httpStatus.OK)

        const account1 = await Account.findById(accountId).lean()

        expect(oldAccount.starredClubs).not.toContain(clubId)
        expect(account1.starredClubs).toContain(clubId)
        expect(account1.starredClubs.length).toEqual(1)

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
                add: true,
            })
            .expect(httpStatus.OK)

        const account2 = await Account.findById(accountId).lean()

        expect(account2.starredClubs).toContain(clubId)
        expect(account2.starredClubs.length).toEqual(1)

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
                add: false,
            })
            .expect(httpStatus.OK)

        const account3 = await Account.findById(accountId).lean()

        expect(account3.starredClubs).not.toContain(clubId)
        expect(account3.starredClubs.length).toEqual(0)

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
                add: false,
            })
            .expect(httpStatus.OK)

        const account4 = await Account.findById(accountId).lean()

        expect(account4.starredClubs).not.toContain(clubId)
        expect(account4.starredClubs.length).toEqual(0)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({})
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                clubId,
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/account/star-club')
            .set('accountId', 'f_1')
            .send({
                add: true,
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
