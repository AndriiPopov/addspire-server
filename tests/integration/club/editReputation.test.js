const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')

setupTestDB()

describe('POST /api/club/edit-reputation', () => {
    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/club/edit-reputation')
            .set('accountId', '0')
            .send({})
            .expect(httpStatus.BAD_REQUEST)
    })
})
