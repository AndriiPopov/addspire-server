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

setupTestDB()

describe('POST /api/answer/create', () => {
    test('should return 201 and successfully create new answer if data is ok', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()
        const oldQuestion = await Question.findOne({
            name: 'Test question',
        })
        const questionId = oldQuestion._id.toString()
        const oldUser = await Account.findOne({ facebookProfile: 'f_3' })
        const userId = oldUser._id.toString()

        await request(app)
            .post('/api/answer/create')
            .set('accountId', 'f_3')
            .send({
                description: 'Here is the information',
                images: ['test2.jpg'],
                questionId,
                bookmark: true,
            })
            .expect(httpStatus.OK)

        const club = await Club.findById(clubId)
        expect(club).toBeDefined()

        const user = await Account.findById(userId)

        const question = await Question.findById(questionId)

        const resource = await Answer.findOne({
            description: 'Here is the information',
        })
        const resourceId = resource._id.toString()

        const reputation = await Reputation.findOne({
            owner: userId,
            club: clubId,
        }).lean()
        const reputationId = reputation._id.toString()

        expect(club.questionsCount).toEqual(oldClub.questionsCount)

        expect(user.followingQuestions).toContain(questionId)
        expect(user.followingQuestions).not.toContain(resourceId)

        expect(question.followers).toContain(userId)
        expect(question.followersCount - oldQuestion.followersCount).toEqual(1)
        expect(resource.owner).toEqual(userId)
        expect(resource.reputation).toEqual(reputationId)
        expect(resource.club).toEqual(clubId)

        expect(resource.question).toEqual(questionId)
        expect(question.answersCount - oldQuestion.answersCount).toEqual(1)

        expect(question.answered.length - oldQuestion.answered.length).toEqual(
            1
        )
        expect(question.answered).toContain(userId)
        expect(question.acceptedAnswer).toEqual('no')
    })

    test('should not add question to following if bookmark is false', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question',
        })
        const questionId = oldQuestion._id.toString()
        const oldUser = await Account.findOne({ facebookProfile: 'f_3' })
        const userId = oldUser._id.toString()

        await request(app)
            .post('/api/answer/create')
            .set('accountId', 'f_3')
            .send({
                description: 'Here is the information',
                images: ['test2.jpg'],
                questionId,
            })
            .expect(httpStatus.OK)

        const user = await Account.findById(userId)

        const question = await Question.findById(questionId)

        expect(user.followingQuestions).not.toContain(questionId)
        expect(question.followers).not.toContain(userId)
        expect(question.followersCount - oldQuestion.followersCount).toEqual(0)
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/answer/create')
            .set('accountId', 'f_0')
            .send({
                description: 'I want',
                images: ['test1.jpg', 'test2.jpg'],
            })
            .expect(httpStatus.BAD_REQUEST)
    })

    test('should return conflict if the user already answered', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/answer/create')
            .set('accountId', 'f_1')
            .send({
                description: 'Here is the information',
                images: ['test2.jpg'],
                questionId,
            })
            .expect(httpStatus.CONFLICT)

        const question = await Question.findById(questionId).lean()

        const resource = await Answer.findOne({
            description: 'Here is the information',
        })
        expect(resource).toBeNull()

        expect(question.answersCount).toEqual(oldQuestion.answersCount)

        expect(question.answered.length).toEqual(oldQuestion.answered.length)
        expect(question.answered).toEqual(oldQuestion.answered)
        expect(question.acceptedAnswer).toEqual('no')
    })
})
