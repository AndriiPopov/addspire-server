const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const {
    Club,
    Account,
    Reputation,
    Resource,
    Comment,
} = require('../../../src/models')

setupTestDB()

describe('POST /api/comment/create', () => {
    test('should return 201 and successfully create new comment to question if data is ok', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()

        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: 'f_5' })
        const userId = oldUser._id.toString()

        const reputation = oldUser.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(reputation).toBeDefined()
        const { reputationId } = reputation

        const oldReputationObj = await Reputation.findById(reputationId).lean()
        expect(oldReputationObj).toBeDefined()

        await request(app)
            .post('/api/comment/create')
            .set('accountId', 'f_5')
            .send({
                text: 'This is a very nice article!',
                resourceId: questionId,
            })
            .expect(httpStatus.OK)

        const comment = await Comment.findOne({
            text: 'This is a very nice article!',
        }).lean()
        expect(comment).toBeDefined()
        const commentId = comment._id.toString()

        const user = await Account.findById(userId).lean()
        expect(user).toBeDefined()
        expect(oldUser.followingResources).not.toContain(questionId)
        expect(user.followingResources).toContain(questionId)

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).toBeDefined()

        expect(oldReputationObj.comments).not.toContain(commentId)
        expect(reputationObj.comments).toContain(commentId)

        const question = await Resource.findById(questionId).lean()

        expect(oldQuestion.comments).not.toContain(commentId)
        expect(question.comments).toContain(commentId)
        expect(question.commentsCount - oldQuestion.commentsCount).toEqual(1)

        expect(oldQuestion.followers).not.toContain(userId)
        expect(question.followers).toContain(userId)
        expect(question.followersCount - oldQuestion.followersCount).toEqual(1)
    })

    test('should return 201 and successfully create new comment to answer if data is ok', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()

        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldAnswer = await Resource.findOne({
            name: 'Test answer',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: 'f_5' })
        const userId = oldUser._id.toString()

        const reputation = oldUser.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(reputation).toBeDefined()
        const { reputationId } = reputation

        const oldReputationObj = await Reputation.findById(reputationId).lean()
        expect(oldReputationObj).toBeDefined()

        await request(app)
            .post('/api/comment/create')
            .set('accountId', 'f_5')
            .send({
                text: 'This is a very nice answer!',
                resourceId: answerId,
            })
            .expect(httpStatus.OK)

        const comment = await Comment.findOne({
            text: 'This is a very nice answer!',
        }).lean()
        expect(comment).toBeDefined()
        const commentId = comment._id.toString()

        const user = await Account.findById(userId).lean()
        expect(user).toBeDefined()
        expect(oldUser.followingResources).not.toContain(questionId)
        expect(user.followingResources).toContain(questionId)

        const reputationObj = await Reputation.findById(reputationId).lean()
        expect(reputationObj).toBeDefined()

        expect(oldReputationObj.comments).not.toContain(commentId)
        expect(reputationObj.comments).toContain(commentId)

        const answer = await Resource.findById(answerId).lean()

        expect(oldAnswer.comments).not.toContain(commentId)
        expect(answer.comments).toContain(commentId)
        expect(answer.commentsCount - oldAnswer.commentsCount).toEqual(1)

        const question = await Resource.findById(questionId).lean()

        expect(oldQuestion.followers).not.toContain(userId)
        expect(question.followers).toContain(userId)
        expect(question.followersCount - oldQuestion.followersCount).toEqual(1)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()

        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldAnswer = await Resource.findOne({
            name: 'Test answer',
        }).lean()
        const answerId = oldAnswer._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: 'f_2' })
        const userId = oldUser._id.toString()

        const reputation = oldUser.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(reputation).toBeDefined()
        const { reputationId } = reputation

        const oldReputationObj = await Reputation.findById(reputationId).lean()
        expect(oldReputationObj).toBeDefined()

        await request(app)
            .post('/api/comment/create')
            .set('accountId', 'f_2')
            .send({
                resourceId: answerId,
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
