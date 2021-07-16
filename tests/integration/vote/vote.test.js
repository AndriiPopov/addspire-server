const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Reputation, Question, Count } = require('../../../src/models')
const value = require('../../../src/config/value')

setupTestDB()

describe('POST /api/vote/vote', () => {
    test('should return 201 and successfully vote up question if data is ok and cannot vote it again, but another user can vote it down', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldCount = await Count.findById(oldQuestion.count).lean()

        const clubId = oldQuestion.club

        const oldUserG = await Account.findOne({
            facebookProfile: 'f_1',
        }).lean()
        const userIdG = oldUserG._id.toString()

        const oldReputationObjG = await Reputation.findOne({
            owner: userIdG,
            club: clubId,
        }).lean()
        const reputationIdG = oldReputationObjG._id.toString()

        const oldUserG2 = await Account.findOne({
            facebookProfile: 'f_2',
        }).lean()
        const userIdG2 = oldUserG2._id.toString()

        const oldReputationObjG2 = await Reputation.findOne({
            owner: userIdG2,
            club: clubId,
        }).lean()
        const reputationIdG2 = oldReputationObjG2._id.toString()

        const oldUserR = await Account.findOne({
            facebookProfile: 'f_0',
        }).lean()
        const userIdR = oldUserR._id.toString()

        const oldReputationObjR = await Reputation.findOne({
            owner: userIdR,
            club: clubId,
        }).lean()
        const reputationIdR = oldReputationObjR._id.toString()

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', 'f_1')
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

        const count = await Count.findById(oldQuestion.count).lean()

        expect(oldCount.reputationDestribution).not.toBeDefined()

        expect(count.reputationDestribution).toMatchObject({
            [userIdR]: value.plusResource,
        })

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', 'f_1')
            .send({
                resourceId: questionId,
                type: 'question',
                minus: true,
            })
            .expect(httpStatus.UNAUTHORIZED)

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', 'f_2')
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

        const newCount = await Count.findById(oldQuestion.count).lean()

        expect(newCount.reputationDestribution).toMatchObject({
            [userIdR]: value.plusResource + value.minusResource,
        })

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', 'f_2')
            .send({
                resourceId: questionId,
                type: 'question',
            })
            .expect(httpStatus.CONFLICT)
    })

    test('should return 201 and successfully vote up question but not add reputation ifself vote', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', 'f_0')
            .send({
                resourceId: questionId,
                type: 'question',
            })
            .expect(httpStatus.CONFLICT)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/vote/vote')
            .set('accountId', 'f_1')
            .send({
                resourceId: questionId,
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
