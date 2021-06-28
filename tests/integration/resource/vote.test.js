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
const { votesDownCount } = require('../../../src/models/basicModel/basicVotes')

setupTestDB()

describe('POST /api/resource/vote', () => {
    test('should return 201 and successfully vote up question if data is ok and cannot vote it again, but another user can vote it down', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldUserG = await Account.findOne({
            facebookProfile: 'f_1',
        }).lean()
        const userIdG = oldUserG._id.toString()

        const oldReputationG = oldUserG.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputationG).not.toBeNull()
        const { reputationId: reputationIdG } = oldReputationG
        const oldReputationObjG = await Reputation.findById(reputationIdG)
        expect(oldReputationObjG).not.toBeNull()

        const oldUserG2 = await Account.findOne({
            facebookProfile: 'f_2',
        }).lean()
        const userIdG2 = oldUserG2._id.toString()

        const oldReputationG2 = oldUserG2.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputationG2).toBeDefined()
        const { reputationId: reputationIdG2 } = oldReputationG2
        const oldReputationObjG2 = await Reputation.findById(reputationIdG2)
        expect(oldReputationObjG2).toBeDefined()

        const oldUserR = await Account.findOne({
            facebookProfile: 'f_0',
        }).lean()
        const userIdR = oldUserR._id.toString()

        const oldReputationR = oldUserR.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputationR).toBeDefined()
        const { reputationId: reputationIdR } = oldReputationR
        const oldReputationObjR = await Reputation.findById(reputationIdR)
        expect(oldReputationObjR).toBeDefined()

        await request(app)
            .post('/api/resource/vote')
            .set('accountId', 'f_1')
            .send({
                resourceId: questionId,
                type: 'question',
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()
        expect(question).toBeDefined()

        const reputationObjR = await Reputation.findById(reputationIdR).lean()
        expect(reputationObjR).toBeDefined()

        const reputationObjG = await Reputation.findById(reputationIdG).lean()
        expect(reputationObjG).toBeDefined()

        expect(oldQuestion.votesUp).not.toContain(userIdG)
        expect(question.votesUp).toContain(userIdG)
        expect(oldQuestion.votesDown).not.toContain(userIdG)
        expect(question.votesDown).not.toContain(userIdG)

        expect(question.votesDownCount).toEqual(oldQuestion.votesDownCount)
        expect(question.votesUpCount - oldQuestion.votesUpCount).toEqual(1)

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
            .post('/api/resource/vote')
            .set('accountId', 'f_1')
            .send({
                resourceId: questionId,
                type: 'question',
                minus: true,
            })
            .expect(httpStatus.UNAUTHORIZED)

        await request(app)
            .post('/api/resource/vote')
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
            .post('/api/resource/vote')
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
            .post('/api/resource/vote')
            .set('accountId', 'f_0')
            .send({
                resourceId: questionId,
                type: 'question',
            })
            .expect(httpStatus.CONFLICT)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const oldQuestion = await Question.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldUserG = await Account.findOne({
            facebookProfile: 'f_1',
        }).lean()
        const userIdG = oldUserG._id.toString()

        const oldReputationG = oldUserG.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputationG).not.toBeNull()
        const { reputationId: reputationIdG } = oldReputationG
        const oldReputationObjG = await Reputation.findById(reputationIdG)
        expect(oldReputationObjG).not.toBeNull()

        const oldUserG2 = await Account.findOne({
            facebookProfile: 'f_2',
        }).lean()
        const userIdG2 = oldUserG2._id.toString()

        const oldReputationG2 = oldUserG2.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputationG2).toBeDefined()
        const { reputationId: reputationIdG2 } = oldReputationG2
        const oldReputationObjG2 = await Reputation.findById(reputationIdG2)
        expect(oldReputationObjG2).toBeDefined()

        const oldUserR = await Account.findOne({
            facebookProfile: 'f_0',
        }).lean()
        const userIdR = oldUserR._id.toString()

        const oldReputationR = oldUserR.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputationR).toBeDefined()
        const { reputationId: reputationIdR } = oldReputationR
        const oldReputationObjR = await Reputation.findById(reputationIdR)
        expect(oldReputationObjR).toBeDefined()

        await request(app)
            .post('/api/resource/vote')
            .set('accountId', 'f_1')
            .send({
                resourceId: questionId,
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
