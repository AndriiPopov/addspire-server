const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation, Resource } = require('../../../src/models')
const value = require('../../../src/config/value')

setupTestDB()

describe('POST /api/resource/accept', () => {
    test('should return 201 and successfully accept answer if data is ok and not to accept another answer', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldAnswer = await Resource.findOne({
            name: 'Test answer number 2',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: 'f_2' }).lean()
        const userId = oldUser._id.toString()

        const oldReputation = oldUser.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputation).toBeDefined()
        const { reputationId } = oldReputation
        const oldReputationObj = await Reputation.findById(reputationId)
        expect(oldReputationObj).toBeDefined()

        await request(app)
            .post('/api/resource/accept')
            .set('accountId', 'f_0')
            .send({
                answerId,
            })
            .expect(httpStatus.OK)

        const club = await Club.findById(clubId).lean()
        expect(club).toBeDefined()

        const user = await Account.findById(userId).lean()
        expect(user).toBeDefined()

        const question = await Resource.findById(questionId).lean()
        expect(question).toBeDefined()

        const answer = await Resource.findById(answerId).lean()
        expect(answer).toBeDefined()

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).toBeDefined()

        expect(oldQuestion.acceptedAnswer).toEqual('no')
        expect(question.acceptedAnswer).toEqual(answerId)

        expect(reputationObj.reputation - oldReputationObj.reputation).toEqual(
            value.acceptedAnswer
        )

        await request(app)
            .post('/api/resource/accept')
            .set('accountId', 'f_0')
            .send({
                answerId,
            })
            .expect(httpStatus.BAD_REQUEST)

        const oldAnswer2 = await Resource.findOne({
            name: 'Test answer',
        }).lean()
        const answerId2 = oldAnswer2._id.toString()
        await request(app)
            .post('/api/resource/accept')
            .set('accountId', 'f_0')
            .send({
                answerId: answerId2,
            })
            .expect(httpStatus.BAD_REQUEST)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldAnswer = await Resource.findOne({
            name: 'Test answer number 2',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: 'f_2' }).lean()
        const userId = oldUser._id.toString()

        const oldReputation = oldUser.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputation).toBeDefined()
        const { reputationId } = oldReputation
        const oldReputationObj = await Reputation.findById(reputationId)
        expect(oldReputationObj).toBeDefined()

        await request(app)
            .post('/api/resource/accept')
            .set('accountId', 'f_0')
            .send({})

            .expect(httpStatus.BAD_REQUEST)
    })
})
