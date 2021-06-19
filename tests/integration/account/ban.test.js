const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/ban', () => {
    test('should return 200 and successfully ban another account and unban it if user is admin', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const user = await Account.findOne({
            facebookProfile: 'f_1',
        }).lean()
        const banUserId = user._id.toString()

        const oldReputation = user.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputation).not.toBeNull()
        const { reputationId } = oldReputation
        const oldReputationObj = await Reputation.findById(reputationId)
        expect(oldReputationObj).not.toBeNull()

        await request(app)
            .post('/api/account/ban')
            .set('accountId', 'f_0')
            .send({
                banUserId,
                clubId,
                banned: true,
            })
            .expect(httpStatus.OK)

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).not.toBeNull()

        expect(reputationObj.banned).toBeTruthy()

        await request(app)
            .post('/api/resource/create')
            .set('accountId', 'f_1')
            .send({
                clubId,
                type: 'question',
                name: 'How to drive a car?',
                description: 'I want to know how to o it.',
                images: ['test1.jpg', 'test2.jpg'],
            })
            .expect(httpStatus.CONFLICT)

        await request(app)
            .post('/api/account/ban')
            .set('accountId', 'f_0')
            .send({
                banUserId,
                clubId,
                banned: false,
            })
            .expect(httpStatus.OK)

        const newReputationObj = await Reputation.findById(reputationId).lean()
        expect(newReputationObj).not.toBeNull()

        expect(newReputationObj.banned).toBeFalsy()

        await request(app)
            .post('/api/resource/create')
            .set('accountId', 'f_1')
            .send({
                clubId,
                type: 'question',
                name: 'How to drive a car?',
                description: 'I want to know how to o it.',
                images: ['test1.jpg', 'test2.jpg'],
            })
            .expect(httpStatus.CREATED)
    })

    test('should return 400 user is not admin', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const user = await Account.findOne({
            facebookProfile: 'f_1',
        }).lean()
        const banUserId = user._id.toString()

        const oldReputation = user.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputation).not.toBeNull()
        const { reputationId } = oldReputation
        const oldReputationObj = await Reputation.findById(reputationId)
        expect(oldReputationObj).not.toBeNull()

        await request(app)
            .post('/api/account/ban')
            .set('accountId', 'f_2')
            .send({
                banUserId,
                clubId,
                banned: true,
            })
            .expect(httpStatus.UNAUTHORIZED)

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).not.toBeNull()

        expect(reputationObj.banned).toBeFalsy()
    })

    test('should return 400 banned user is admin', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const user = await Account.findOne({
            facebookProfile: 'f_0',
        }).lean()
        const banUserId = user._id.toString()

        const oldReputation = user.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputation).not.toBeNull()
        const { reputationId } = oldReputation
        const oldReputationObj = await Reputation.findById(reputationId)
        expect(oldReputationObj).not.toBeNull()

        await request(app)
            .post('/api/account/ban')
            .set('accountId', 'f_0')
            .send({
                banUserId,
                clubId,
                banned: true,
            })
            .expect(httpStatus.UNAUTHORIZED)

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).not.toBeNull()

        expect(reputationObj.banned).toBeFalsy()
    })

    test('should return 400 if validation fails', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const user = await Account.findOne({
            facebookProfile: 'f_1',
        }).lean()
        const banUserId = user._id.toString()

        const oldReputation = user.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputation).not.toBeNull()
        const { reputationId } = oldReputation
        const oldReputationObj = await Reputation.findById(reputationId)
        expect(oldReputationObj).not.toBeNull()

        await request(app)
            .post('/api/account/ban')
            .set('accountId', 'f_0')
            .send({
                banUserId,
                banned: true,
            })
            .expect(httpStatus.BAD_REQUEST)

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).not.toBeNull()

        expect(reputationObj.banned).toBeFalsy()
    })
})
