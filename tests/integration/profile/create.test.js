const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account } = require('../../../src/models')

setupTestDB()

describe('POST /api/profile/create', () => {
    test('should return 200 and successfully create a profile', async () => {
        const oldUser = await Account.findOne({
            facebookProfile: '0',
        }).lean()

        const userId = oldUser._id.toString()

        expect(oldUser.defaultProfile.toString()).toEqual(
            oldUser.profiles[0]._id.toString()
        )

        await request(app)
            .post('/api/profile/create')
            .set('accountId', '0')
            .send({
                label: 'Profile 2',
            })
            .expect(httpStatus.OK)

        const user2 = await Account.findById(userId).lean()
        expect(user2.defaultProfile.toString()).toEqual(
            oldUser.defaultProfile.toString()
        )
        expect(user2.profiles.length).toEqual(2)
        expect(user2.profiles[1]._id).not.toEqual(user2.profiles[0]._id)
        expect(user2.profiles[1]._id).toBeDefined()
        expect(user2.profiles[1].label).toEqual('Profile 2')
        expect(user2.profiles[1].name).toEqual(user2.profiles[0].name)
        expect(user2.profiles[1].tags).toEqual(user2.profiles[0].tags)
        expect(user2.profiles[1].anonym).toBeFalsy()
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/profile/create')
            .set('accountId', '0')
            .send({})
            .expect(httpStatus.BAD_REQUEST)
    })
})
