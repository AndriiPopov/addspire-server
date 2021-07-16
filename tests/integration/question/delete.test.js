const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Question, Account, System } = require('../../../src/models')

setupTestDB()

describe('POST /api/question/delete', () => {
    test('should return 201 and successfully delete question if data is ok and the user is admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/question/delete')
            .set('accountId', 'f_0')
            .send({
                resourceId: questionId,
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()
        expect(question).toBeNull()

        const club = await Club.findById(clubId).lean()

        expect(oldClub.questionsCount - club.questionsCount).toEqual(1)
    })

    test('should return 400 error if validation fails', async () => {
        await request(app)
            .post('/api/question/delete')
            .set('accountId', 'f_0')
            .send({})
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/delete')
            .set('accountId', 'f_2')
            .send({
                resourceId: questionId,
            })
            .expect(httpStatus.UNAUTHORIZED)
    })

    test('should return 201 and successfully delete question and return coins to the owner', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: 'f_2' })
        const userId = oldUser._id.toString()

        await Account.updateOne({ _id: userId }, { wallet: 200 })

        await request(app)
            .post('/api/question/edit')
            .set('accountId', 'f_2')
            .send({
                resourceId: questionId,
                name: 'Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
                bonusCoins: 100,
            })
            .expect(httpStatus.OK)

        await request(app)
            .post('/api/question/delete')
            .set('accountId', 'f_0')
            .send({
                resourceId: questionId,
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()
        expect(question).toBeNull()

        const system = await System.System.findOne({}).lean()
        expect(system.myCoins).toEqual(100 * 0.05)

        const user = await Account.findById(userId).lean()
        expect(user.wallet).toEqual(200 - 100 * 0.05)
    })

    test('should return 201 and successfully delete question and not return coins to the owner if bonus is paid', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: 'f_2' })
        const userId = oldUser._id.toString()

        await Account.updateOne({ _id: userId }, { wallet: 200 })

        await request(app)
            .post('/api/question/edit')
            .set('accountId', 'f_2')
            .send({
                resourceId: questionId,
                name: 'Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
                bonusCoins: 100,
            })
            .expect(httpStatus.OK)
        await Question.updateOne({ _id: questionId }, { bonusPaid: true })

        await request(app)
            .post('/api/question/delete')
            .set('accountId', 'f_0')
            .send({
                resourceId: questionId,
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()
        expect(question).toBeNull()

        const system = await System.System.findOne({}).lean()
        expect(system.myCoins).toEqual(100 * 0.05)

        const user = await Account.findById(userId).lean()
        expect(user.wallet).toEqual(200 - 100)
    })
})
