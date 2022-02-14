const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const {
    Account,
    Reputation,
    Question,
    Club,
    Answer,
} = require('../../../src/models')
const value = require('../../../src/config/value')

setupTestDB()

describe('POST /api/vote/vote', () => {
    test('should return 201 and successfully vote up question if data is ok and cannot vote it again, but another user can vote it down', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const clubId = oldQuestion.club

        const oldUserG = await Account.findOne({
            facebookProfile: '1',
        }).lean()
        const userIdG = oldUserG._id.toString()

        const oldReputationObjG = await Reputation.findOne({
            owner: userIdG,
            club: clubId,
        }).lean()
        const reputationIdG = oldReputationObjG._id.toString()

        const oldUserG2 = await Account.findOne({
            facebookProfile: '2',
        }).lean()
        const userIdG2 = oldUserG2._id.toString()

        const oldReputationObjG2 = await Reputation.findOne({
            owner: userIdG2,
            club: clubId,
        }).lean()
        const reputationIdG2 = oldReputationObjG2._id.toString()

        const oldUserR = await Account.findOne({
            facebookProfile: '0',
        }).lean()
        const userIdR = oldUserR._id.toString()

        const oldReputationObjR = await Reputation.findOne({
            owner: userIdR,
            club: clubId,
        }).lean()
        const reputationIdR = oldReputationObjR._id.toString()

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '1')
            .send({
                resourceId: questionId,
                type: 'question',
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()

        const reputationObjR = await Reputation.findById(reputationIdR).lean()

        const reputationObjG = await Reputation.findById(reputationIdG).lean()

        expect(oldQuestion.votesUp).not.toContain(userIdG)
        expect(question.votesUp).toContain(userIdG)
        expect(oldQuestion.votesDown).not.toContain(userIdG)
        expect(question.votesDown).not.toContain(userIdG)

        expect(question.votesDownCount).toEqual(oldQuestion.votesDownCount)
        expect(question.votesUpCount - oldQuestion.votesUpCount).toEqual(1)
        expect(question.vote).toEqual(1)
        expect(question.voteReputation).toEqual(value.plusResource)

        expect(reputationObjG.minusToday).toEqual(oldReputationObjG.minusToday)
        expect(reputationObjG.plusToday - oldReputationObjG.plusToday).toEqual(
            1
        )

        expect(
            reputationObjR.reputation - oldReputationObjR.reputation
        ).toEqual(value.plusResource)

        expect(
            reputationObjR.gains.length - oldReputationObjR.gains.length
        ).toEqual(1)

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '1')
            .send({
                resourceId: questionId,
                type: 'question',
                minus: true,
            })
            .expect(httpStatus.UNAUTHORIZED)

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '2')
            .send({
                resourceId: questionId,
                type: 'question',
                minus: true,
            })
            .expect(httpStatus.OK)

        const newQuestion = await Question.findById(questionId).lean()
        expect(newQuestion).toBeDefined()

        const newReputationObjR = await Reputation.findById(
            reputationIdR
        ).lean()
        expect(newReputationObjR).toBeDefined()

        const reputationObjG2 = await Reputation.findById(reputationIdG2).lean()
        expect(reputationObjG2).toBeDefined()

        expect(question.votesUp).toContain(userIdG)
        expect(newQuestion.votesUp).toContain(userIdG)
        expect(newQuestion.votesUp).not.toContain(userIdG2)

        expect(question.votesDown).not.toContain(userIdG2)
        expect(newQuestion.votesDown).toContain(userIdG2)

        expect(newQuestion.votesUpCount).toEqual(question.votesUpCount)
        expect(newQuestion.votesDownCount - question.votesDownCount).toEqual(1)

        expect(newQuestion.vote).toEqual(0)
        expect(newQuestion.voteReputation).toEqual(
            value.plusResource + value.minusResource
        )

        expect(reputationObjG2.plusToday).toEqual(oldReputationObjG2.plusToday)
        expect(
            reputationObjG2.minusToday - oldReputationObjG2.minusToday
        ).toEqual(1)

        expect(
            newReputationObjR.reputation - reputationObjR.reputation
        ).toEqual(value.minusResource)

        expect(
            newReputationObjR.gains.length - reputationObjR.gains.length
        ).toEqual(1)

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '2')
            .send({
                resourceId: questionId,
                type: 'question',
            })
            .expect(httpStatus.CONFLICT)
    })

    test('should return 201 and successfully vote up question but not add reputation ifself vote', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '0')
            .send({
                resourceId: questionId,
                type: 'question',
            })
            .expect(httpStatus.CONFLICT)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '1')
            .send({
                resourceId: questionId,
            })
            .expect(httpStatus.BAD_REQUEST)
    })

    test('should save the best answer after vote', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/question/create')
            .set('accountId', '0')
            .send({
                clubId,
                name: 'Voting question?Voting question?',
                description: 'I want to know how to o it.',
                images: ['test1.jpg', 'test2.jpg'],
                tags: [
                    'res1',
                    'res2',
                    'res3sdfsfsdfsdfsdfsd',
                    'res3sdfsfsdfsdfsdfsd',
                    'res3sdfsfsdfsdfsdfsd',
                ],
                bookmark: true,
            })
            .expect(httpStatus.OK)

        const question = await Question.findOne({
            name: 'Voting question?Voting question?',
        }).lean()
        const questionId = question._id.toString()
        expect(question.bestAnswer).not.toBeDefined()

        await request(app)
            .post('/api/answer/create')
            .set('accountId', '3')
            .send({
                description: 'Here is the information',
                images: ['test2.jpg'],
                questionId,
                bookmark: true,
            })
            .expect(httpStatus.OK)

        const answer1 = await Answer.findOne({
            question: questionId,
            description: 'Here is the information',
        }).lean()
        const answer1Id = answer1._id.toString()

        const question1 = await Question.findById(questionId).lean()
        expect(question1.bestAnswer).toEqual(answer1Id)

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '1')
            .send({
                resourceId: answer1Id,
                type: 'answer',
            })
            .expect(httpStatus.OK)

        const question2 = await Question.findById(questionId).lean()
        expect(question2.bestAnswer).toEqual(answer1Id)

        await request(app)
            .post('/api/answer/create')
            .set('accountId', '7')
            .send({
                description: 'Here is the information2',
                images: ['test2.jpg'],
                questionId,
                bookmark: true,
            })
            .expect(httpStatus.OK)

        const answer2 = await Answer.findOne({
            question: questionId,
            description: 'Here is the information2',
        }).lean()
        const answer2Id = answer2._id.toString()

        const question3 = await Question.findById(questionId).lean()
        expect(question3.bestAnswer).toEqual(answer1Id)

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '1')
            .send({
                resourceId: answer2Id,
                type: 'answer',
            })
            .expect(httpStatus.OK)
        await request(app)
            .post('/api/vote/vote')
            .set('accountId', '4')
            .send({
                resourceId: answer2Id,
                type: 'answer',
            })
            .expect(httpStatus.OK)

        const question4 = await Question.findById(questionId).lean()
        expect(question4.bestAnswer).toEqual(answer2Id)
    })
})
