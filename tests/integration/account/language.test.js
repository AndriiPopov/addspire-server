const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/language', () => {
    test('should save language', async () => {
        const oldAccount = await Account.findOne({
            facebookProfile: '1',
        }).lean()
        const accountId = oldAccount._id.toString()

        await request(app)
            .post('/api/account/language')
            .set('accountId', '1')
            .send({
                language: 'fr',
            })
            .expect(httpStatus.OK)

        const account1 = await Account.findById(accountId).lean()
        expect(oldAccount.language).toEqual('en')
        expect(account1.language).toEqual('fr')
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/account/language')
            .set('accountId', '1')
            .send({
                language: 2,
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
