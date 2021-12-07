const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')

setupTestDB()

describe('POST /api/profile/edit', () => {
    // Delete is tested in edit profile
    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/profile/delete')
            .set('accountId', '0')
            .send({})
            .expect(httpStatus.BAD_REQUEST)
    })
})
