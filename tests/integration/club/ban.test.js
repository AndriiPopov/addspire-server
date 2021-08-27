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
            facebookProfile: 'f_2',
        }).lean()
        const userId = user._id

        const oldReputation = await Reputation.findOne({
            club: clubId,
            owner: userId,
        }).lean()
        const reputationId = oldReputation._id

        await request(app)
            .post('/api/club/ban')
            .set('accountId', 'f_0')
            .send({
                clubId,
                banning: true,
                reputationId,
            })
            .expect(httpStatus.OK)

        const reputation = await Reputation.findById(reputationId).lean()
        expect(reputation.banned).toBeTruthy()

        const club = await Club.findById(clubId).lean()
        expect(club.banned).toContain(reputationId.toString())

        await request(app)
            .post('/api/question/create')
            .set('accountId', 'f_2')
            .send({
                clubId,
                name: 'How to drive a car?',
                description: 'I want to know how to o it.',
                images: ['test1.jpg', 'test2.jpg'],
            })
            .expect(httpStatus.UNAUTHORIZED)

        await request(app)
            .post('/api/club/ban')
            .set('accountId', 'f_0')
            .send({
                clubId,
                banning: false,
                reputationId,
            })
            .expect(httpStatus.OK)

        const newReputationObj = await Reputation.findById(reputationId).lean()
        expect(newReputationObj).not.toBeNull()
        expect(newReputationObj.banned).toBeFalsy()

        const newClub = await Club.findById(clubId).lean()
        expect(newClub.banned).not.toContain(reputationId.toString())

        await request(app)
            .post('/api/question/create')
            .set('accountId', 'f_2')
            .send({
                clubId,
                name: 'How to drive a car?',
                description: 'I want to know how to o it.',
                images: ['test1.jpg', 'test2.jpg'],
            })
            .expect(httpStatus.OK)
    })

    test('should return 400 user is not admin', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const user = await Account.findOne({
            facebookProfile: 'f_1',
        }).lean()
        const userId = user._id

        const oldReputation = await Reputation.findOne({
            club: clubId,
            owner: userId,
        }).lean()
        const reputationId = oldReputation._id

        await request(app)
            .post('/api/club/ban')
            .set('accountId', 'f_2')
            .send({
                clubId,
                banning: true,
                reputationId,
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
        const userId = user._id

        const oldReputation = await Reputation.findOne({
            club: clubId,
            owner: userId,
        }).lean()
        const reputationId = oldReputation._id

        await request(app)
            .post('/api/club/ban')
            .set('accountId', 'f_0')
            .send({
                clubId,
                banning: false,
                reputationId,
            })
            .expect(httpStatus.CONFLICT)

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
        const userId = user._id

        const oldReputation = await Reputation.findOne({
            club: clubId,
            owner: userId,
        }).lean()
        const reputationId = oldReputation._id

        await request(app)
            .post('/api/club/ban')
            .set('accountId', 'f_0')
            .send({
                clubId,
                banning: false,
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/club/ban')
            .set('accountId', 'f_0')
            .send({
                banning: false,
                reputationId,
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/club/ban')
            .set('accountId', 'f_0')
            .send({
                clubId,
                banning: 'asdas',
                reputationId,
            })
            .expect(httpStatus.BAD_REQUEST)

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).not.toBeNull()

        expect(reputationObj.banned).toBeFalsy()
    })
})
