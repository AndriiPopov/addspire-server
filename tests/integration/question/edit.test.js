const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Question, Count, Account, System } = require('../../../src/models')

setupTestDB()

describe('POST /api/question/edit', () => {
    test('should return 201 and successfully edit resource if data is ok and the user is owner', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldCount = await Count.findById(oldQuestion.count).lean()

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '0')
            .send({
                resourceId: questionId,
                name: 'Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
                bonusCoins: 100,
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()

        expect(question.name).toEqual('Test value?')
        expect(question.description).toEqual('Test description.')
        expect(question.images).toEqual(['test3.jpg', 'test4.jpg'])
        expect(question.tags).toEqual(['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'])
        expect(question.bonusCoins).toEqual(0)

        const count = await Count.findById(oldQuestion.count).lean()

        expect(oldCount.question).toEqual(count.question)
        expect(oldCount.questionName).not.toEqual(count.questionName)
        expect(count.questionName).toEqual('Test value?')
    })
    test('should return 201 and successfully edit resource if data is ok and the user is admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '2')
            .send({
                resourceId: questionId,
                name: 'Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()

        expect(question.name).toEqual('Test value?')
        expect(question.description).toEqual('Test description.')
        expect(question.images).toEqual(['test3.jpg', 'test4.jpg'])
    })

    const testWithCoins = (accountCoins, bonusCoins, bonusCoins2) =>
        test('should return 201 and successfully create new question if data is ok and add coins to bonus', async () => {
            const oldQuestion = await Question.findOne({
                name: 'Test question Test question 2',
            }).lean()
            const questionId = oldQuestion._id.toString()

            const oldUser = await Account.findOne({ facebookProfile: '2' })
            const userId = oldUser._id.toString()

            await Account.updateOne({ _id: userId }, { wallet: accountCoins })

            await request(app)
                .post('/api/question/edit')
                .set('accountId', '2')
                .send({
                    resourceId: questionId,
                    name: 'Test value?',
                    description: 'Test description.',
                    images: ['test3.jpg', 'test4.jpg'],
                    bonusCoins,
                })
                .expect(httpStatus.OK)

            await request(app)
                .post('/api/question/edit')
                .set('accountId', '2')
                .send({
                    resourceId: questionId,
                    name: 'Test value?',
                    description: 'Test description.',
                    images: ['test3.jpg', 'test4.jpg'],
                    bonusCoins: bonusCoins2,
                })
                .expect(httpStatus.OK)

            const user = await Account.findById(userId)

            const question = await Question.findById(questionId).lean()

            const bonusSum = bonusCoins + bonusCoins2
            const realCoins = Math.min(bonusSum, accountCoins)

            expect(question.bonusCoins).toEqual(realCoins * 0.95)

            expect(user.wallet).toEqual(accountCoins - realCoins)
            expect(user.totalSpent).toEqual(realCoins)
            expect(user.totalEarned).toEqual(0)
            const system = await System.System.findOne({}).lean()
            expect(system.myCoins).toEqual(realCoins * 0.05)
        })

    testWithCoins(100, 50, 100)
    testWithCoins(100, 50, 0)
    testWithCoins(0, 50, 0)
    testWithCoins(50, 100, 50)

    test('if bonus is paid the bonus cannot be edited', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question 2',
        }).lean()
        const questionId = oldQuestion._id.toString()

        const oldUser = await Account.findOne({ facebookProfile: '2' })
        const userId = oldUser._id.toString()

        await Account.updateOne({ _id: userId }, { wallet: 200 })

        await Question.updateOne({ _id: questionId }, { bonusPaid: true })

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '2')
            .send({
                resourceId: questionId,
                name: 'Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
                bonusCoins: 100,
            })
            .expect(httpStatus.OK)

        const user = await Account.findById(userId)

        const question = await Question.findById(questionId).lean()

        expect(question.bonusCoins).toEqual(0)

        expect(user.wallet).toEqual(200)
        expect(user.totalSpent).toEqual(0)
        expect(user.totalEarned).toEqual(0)
        const system = await System.System.findOne({}).lean()
        expect(system.myCoins).toEqual(0)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '0')
            .send({
                name: 'Test value?',
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.BAD_REQUEST)
        await request(app)
            .post('/api/question/edit')
            .set('accountId', '0')
            .send({
                resourceId: questionId,
                name: 'Test value?',
                description: 'ion.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.BAD_REQUEST)
    })
    test('should return 401 error if not author and not admin', async () => {
        const oldQuestion = await Question.findOne({
            name: 'Test question Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/edit')
            .set('accountId', '2')
            .send({
                name: 'Test value?',
                resourceId: questionId,
                description: 'Test description.',
                images: ['test3.jpg', 'test4.jpg'],
            })
            .expect(httpStatus.UNAUTHORIZED)
    })
})
