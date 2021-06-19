const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Resource } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/add-bookmark', () => {
    test('should return 200 and successfully add bookmark and remove it', async () => {
        const oldUser = await Account.findOne({
            facebookProfile: 'f_1',
        }).lean()
        const userId = oldUser._id.toString()

        const resource = await Resource.findOne({
            name: 'Test question 2',
        }).lean()
        const resourceId = resource._id.toString()

        await request(app)
            .post('/api/account/add-bookmark')
            .set('accountId', 'f_1')
            .send({
                type: 'resource',
                resourceId,
            })
            .expect(httpStatus.OK)

        const user = await Account.findById(userId).lean()
        expect(user).not.toBeNull()
        expect(
            oldUser.bookmarks.find((item) => item.itemId === resourceId)
        ).not.toBeDefined()
        const bookmark = user.bookmarks.find(
            (item) => item.itemId === resourceId
        )
        const bookmarkId = bookmark._id.toString()

        expect(bookmark).toBeDefined()
        expect(bookmarkId).toBeDefined()

        await request(app)
            .post('/api/account/remove-bookmark')
            .set('accountId', 'f_1')
            .send({
                bookmarkId,
            })
            .expect(httpStatus.OK)

        const newUser = await Account.findById(userId).lean()
        expect(newUser).not.toBeNull()
        expect(
            newUser.bookmarks.find((item) => item.itemId === resourceId)
        ).not.toBeDefined()
    })

    test('should return 400 if validation fails', async () => {
        const resource = await Resource.findOne({
            name: 'Test question 2',
        }).lean()
        const resourceId = resource._id.toString()

        await request(app)
            .post('/api/account/add-bookmark')
            .set('accountId', 'f_1')
            .send({
                type: 'resourasdasdce',
                resourceId,
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
