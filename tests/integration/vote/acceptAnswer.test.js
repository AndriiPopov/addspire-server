const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const {
    Club,
    Account,
    Reputation,
    Question,
    Answer,
} = require('../../../src/models')
const value = require('../../../src/config/value')

setupTestDB()

describe('POST /api/vote/accept', () => {
    test('should return 201 and successfully accept answer if data is ok and not to accept another answer', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldAnswer = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: '1' }).lean()
        const userId = oldUser._id.toString()

        const oldReputationObj = await Reputation.findOne({
            owner: userId,
            club: clubId,
        }).lean()
        const reputationId = oldReputationObj._id.toString()

        await request(app)
            .post('/api/vote/accept')
            .set('accountId', '0')
            .send({
                answerId,
            })
            .expect(httpStatus.OK)

        const club = await Club.findById(clubId).lean()
        expect(club).toBeDefined()

        const user = await Account.findById(userId).lean()
        expect(user).toBeDefined()

        const question = await Question.findById(questionId).lean()
        expect(question).toBeDefined()

        const answer = await Answer.findById(answerId).lean()
        expect(answer).toBeDefined()

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).toBeDefined()

        expect(oldQuestion.acceptedAnswer).toEqual('no')
        expect(question.acceptedAnswer).toEqual(answerId)

        expect(reputationObj.reputation - oldReputationObj.reputation).toEqual(
            value.acceptedAnswer
        )

        expect(
            reputationObj.gains.length - oldReputationObj.gains.length
        ).toEqual(1)

        await request(app)
            .post('/api/vote/accept')
            .set('accountId', '0')
            .send({
                answerId,
            })
            .expect(httpStatus.CONFLICT)

        const oldAnswer2 = await Answer.findOne({
            description: 'Here is how to test.',
        }).lean()
        const answerId2 = oldAnswer2._id.toString()
        await request(app)
            .post('/api/vote/accept')
            .set('accountId', '0')
            .send({
                answerId: answerId2,
            })
            .expect(httpStatus.CONFLICT)
    })

    test('should not add reputation for accepting self answer', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldAnswer = await Answer.findOne({
            description: 'Self answer to question',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: '1' }).lean()
        const userId = oldUser._id.toString()

        const oldReputationObj = await Reputation.findOne({
            owner: userId,
            club: clubId,
        }).lean()
        const reputationId = oldReputationObj._id.toString()

        await request(app)
            .post('/api/vote/accept')
            .set('accountId', '0')
            .send({
                answerId,
            })
            .expect(httpStatus.OK)

        const club = await Club.findById(clubId).lean()
        expect(club).toBeDefined()

        const user = await Account.findById(userId).lean()
        expect(user).toBeDefined()

        const question = await Question.findById(questionId).lean()
        expect(question).toBeDefined()

        const answer = await Answer.findById(answerId).lean()
        expect(answer).toBeDefined()

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).toBeDefined()

        expect(oldQuestion.acceptedAnswer).toEqual('no')
        expect(question.acceptedAnswer).toEqual(answerId)

        expect(reputationObj.reputation - oldReputationObj.reputation).toEqual(
            0
        )
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/vote/accept')
            .set('accountId', '0')
            .send({})

            .expect(httpStatus.BAD_REQUEST)
    })
})
