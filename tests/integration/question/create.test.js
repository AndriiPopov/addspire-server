const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const {
    Club,
    Account,
    Reputation,
    Question,
    System,
} = require('../../../src/models')

setupTestDB()

describe('POST /api/question/create', () => {
    test('should return 201 and successfully create new question if data is ok', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()
        const oldUser = await Account.findOne({ facebookProfile: 'f_0' })
        const userId = oldUser._id.toString()
        await request(app)
            .post('/api/question/create')
            .set('accountId', 'f_0')
            .send({
                clubId,
                name: 'How to drive a car?',
                description: 'I want to know how to o it.',
                images: ['test1.jpg', 'test2.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
                bonusCoins: 100,
            })
            .expect(httpStatus.OK)

        const club = await Club.findById(clubId)

        const user = await Account.findById(userId)

        const resource = await Question.findOne({
            name: 'How to drive a car?',
        }).lean()
        expect(resource).not.toBeNull()
        const resourceId = resource._id.toString()

        const reputation = await Reputation.findOne({
            owner: userId,
            club: clubId,
        }).lean()
        expect(reputation).not.toBeNull()
        const reputationId = reputation._id.toString()

        expect(club.questionsCount - oldClub.questionsCount).toEqual(1)

        expect(user.followingQuestions).toContain(resourceId)

        expect(resource.name).toEqual('How to drive a car?')
        expect(resource.description).toEqual('I want to know how to o it.')
        expect(resource.images).toContain('test1.jpg')
        expect(resource.images).toContain('test2.jpg')
        expect(resource.images.length).toEqual(2)
        expect(resource.followers).toContain(userId)
        expect(resource.followersCount).toEqual(1)
        expect(resource.owner).toEqual(userId)
        expect(resource.reputation).toEqual(reputationId)
        expect(resource.club).toEqual(clubId)
        expect(resource.answersCount).toEqual(0)
        expect(resource.answered.length).toEqual(0)
        expect(resource.acceptedAnswer).toEqual('no')
        expect(resource.tags).toEqual(['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'])
        expect(resource.bonusCoins).toEqual(0)
    })

    const testWithCoins = (accountCoins, bonusCoins) =>
        test('should return 201 and successfully create new question if data is ok and add coins to bonus', async () => {
            const oldClub = await Club.findOne({ name: 'Test club 1' })
            const clubId = oldClub._id.toString()
            const oldUser = await Account.findOne({ facebookProfile: 'f_0' })
            const userId = oldUser._id.toString()

            await Account.updateOne({ _id: userId }, { wallet: accountCoins })

            await request(app)
                .post('/api/question/create')
                .set('accountId', 'f_0')
                .send({
                    clubId,
                    name: 'How to drive a car?',
                    description: 'I want to know how to o it.',
                    images: ['test1.jpg', 'test2.jpg'],
                    tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
                    bonusCoins,
                })
                .expect(httpStatus.OK)

            const user = await Account.findById(userId)

            const resource = await Question.findOne({
                name: 'How to drive a car?',
            }).lean()

            const realCoins = Math.min(bonusCoins, accountCoins)

            expect(resource.bonusCoins).toEqual(realCoins * 0.95)

            expect(user.wallet).toEqual(accountCoins - realCoins)

            const system = await System.System.findOne({}).lean()
            expect(system.myCoins).toEqual(realCoins * 0.05)
        })

    testWithCoins(50, 100)
    testWithCoins(100, 50)
    testWithCoins(0, 50)

    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()
        await request(app)
            .post('/api/question/create')
            .set('accountId', 'f_0')
            .send({
                clubId,
                name: 'How to drive a car?',
                description: 'I want',
                images: ['test1.jpg', 'test2.jpg'],
            })
            .expect(httpStatus.BAD_REQUEST)
    })

    test('should return conflict reputation is too low for creation', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/club/edit-start-rule')
            .set('accountId', 'f_0')
            .send({
                clubId: oldClub._id,
                value: '100',
            })
            .expect(httpStatus.OK)

        await request(app)
            .post('/api/question/create')
            .set('accountId', 'f_6')
            .send({
                clubId,
                name: 'I know how to help',
                description: 'Here is the information',
                images: ['test2.jpg'],
            })
            .expect(httpStatus.UNAUTHORIZED)
    })
})
