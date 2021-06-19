const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation, Resource } = require('../../../src/models')

setupTestDB()

describe('POST /api/resource/create', () => {
    test('should return 201 and successfully create new question if data is ok', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()
        const oldUser = await Account.findOne({ facebookProfile: 'f_0' })
        const userId = oldUser._id.toString()

        await request(app)
            .post('/api/resource/create')
            .set('accountId', 'f_0')
            .send({
                clubId,
                type: 'question',
                name: 'How to drive a car?',
                description: 'I want to know how to o it.',
                images: ['test1.jpg', 'test2.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
            })
            .expect(httpStatus.CREATED)

        const club = await Club.findById(clubId)
        expect(club).toBeDefined()

        const user = await Account.findById(userId)
        expect(user).toBeDefined()

        const resource = await Resource.findOne({
            name: 'How to drive a car?',
        }).lean()
        expect(resource).toBeDefined()
        const resourceId = resource._id.toString()

        const reputation = user.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(reputation).toBeDefined()
        const { reputationId } = reputation

        const reputationObj = await Reputation.findById(reputationId)
        expect(reputationObj).toBeDefined()

        expect(club.questions).toContain(resourceId)
        expect(club.questionsCount - oldClub.questionsCount).toEqual(1)

        expect(user.followingResources).toContain(resourceId)

        expect(reputationObj.questions).toContain(resourceId)

        expect(resource.name).toEqual('How to drive a car?')
        expect(resource.description).toEqual('I want to know how to o it.')
        expect(resource.images).toContain('test1.jpg')
        expect(resource.images).toContain('test2.jpg')
        expect(resource.images.length).toEqual(2)
        expect(resource.followers).toContain(userId)
        expect(resource.followersCount).toEqual(1)
        expect(resource.owner).toEqual(userId)
        expect(resource.club).toEqual(clubId)
        expect(resource.resourceType).toEqual('question')
        expect(resource.answersCount).toEqual(0)
        expect(resource.answers.length).toEqual(0)
        expect(resource.answered.length).toEqual(0)
        expect(resource.acceptedAnswer).toEqual('no')
        expect(resource.tags).toEqual(['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'])
    })

    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()
        await request(app)
            .post('/api/resource/create')
            .set('accountId', 'f_0')
            .send({
                clubId,
                type: 'question',
                name: 'How to drive a car?',
                description: 'I want',
                images: ['test1.jpg', 'test2.jpg'],
            })
            .expect(httpStatus.BAD_REQUEST)
    })

    test('should return 201 and successfully create new answer if data is ok', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()
        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        })
        const questionId = oldQuestion._id.toString()
        const oldUser = await Account.findOne({ facebookProfile: 'f_3' })
        const userId = oldUser._id.toString()

        await request(app)
            .post('/api/resource/create')
            .set('accountId', 'f_3')
            .send({
                clubId,
                type: 'answer',
                name: 'I know how to help',
                description: 'Here is the information',
                images: ['test2.jpg'],
                questionId,
            })
            .expect(httpStatus.CREATED)

        const club = await Club.findById(clubId)
        expect(club).toBeDefined()

        const user = await Account.findById(userId)
        expect(user).toBeDefined()

        const question = await Resource.findById(questionId)
        expect(question).toBeDefined()

        const resource = await Resource.findOne({
            name: 'I know how to help',
        })
        expect(resource).toBeDefined()
        const resourceId = resource._id.toString()

        const reputation = user.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(reputation).toBeDefined()
        const { reputationId } = reputation

        const reputationObj = await Reputation.findById(reputationId)
        expect(reputationObj).toBeDefined()

        expect(club.questions).toContain(questionId)
        expect(club.questionsCount).toEqual(oldClub.questionsCount)

        expect(user.followingResources).toContain(questionId)
        expect(user.followingResources).not.toContain(resourceId)

        expect(reputationObj.answers).toContain(resourceId)

        expect(question.followers).toContain(userId)
        expect(question.followersCount - oldQuestion.followersCount).toEqual(1)
        expect(resource.owner).toEqual(userId)
        expect(resource.club).toEqual(clubId)
        expect(resource.resourceType).toEqual('answer')
        expect(resource.question).toEqual(questionId)
        expect(question.answersCount - oldQuestion.answersCount).toEqual(1)
        expect(question.answers.length - oldQuestion.answers.length).toEqual(1)
        expect(question.answers).toContain(resourceId)
        expect(question.answered.length - oldQuestion.answered.length).toEqual(
            1
        )
        expect(question.answered).toContain(userId)
        expect(question.acceptedAnswer).toEqual('no')
    })

    test('should return conflict if the user already answered', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()
        const oldQuestion = await Resource.findOne({
            name: 'Test question',
        }).lean()
        const questionId = oldQuestion._id.toString()
        const oldUser = await Account.findOne({ facebookProfile: 'f_1' })
        const userId = oldUser._id.toString()

        const oldReputation = oldUser.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(oldReputation).toBeDefined()
        const { reputationId } = oldReputation

        const oldReputationObj = await Reputation.findById(reputationId)
        expect(oldReputationObj).toBeDefined()

        await request(app)
            .post('/api/resource/create')
            .set('accountId', 'f_1')
            .send({
                clubId,
                type: 'answer',
                name: 'I know how to help',
                description: 'Here is the information',
                images: ['test2.jpg'],
                questionId,
            })
            .expect(httpStatus.CONFLICT)

        const club = await Club.findById(clubId)
        expect(club).toBeDefined()

        const user = await Account.findById(userId)
        expect(user).toBeDefined()

        const question = await Resource.findById(questionId).lean()
        expect(question).toBeDefined()

        const resource = await Resource.findOne({
            name: 'I know how to help',
        })
        expect(resource).toBeNull()

        const reputationObj = await Reputation.findById(reputationId)
        expect(reputationObj).toBeDefined()

        expect(club.answers).toEqual(oldClub.answers)

        expect(reputationObj.answers).toEqual(oldReputationObj.answers)

        expect(question.answersCount).toEqual(oldQuestion.answersCount)
        expect(question.answers.length).toEqual(oldQuestion.answers.length)

        expect(question.answered.length).toEqual(oldQuestion.answered.length)
        expect(question.answered).toEqual(oldQuestion.answered)
        expect(question.acceptedAnswer).toEqual('no')
    })

    test('should return conflict reputation is too low for creation', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()

        await request(app)
            .post('/api/club/edit')
            .set('accountId', 'f_0')
            .send({
                clubId: oldClub._id,
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                startConversation: '100',
            })
            .expect(httpStatus.CREATED)

        await request(app)
            .post('/api/resource/create')
            .set('accountId', 'f_6')
            .send({
                clubId,
                type: 'question',
                name: 'I know how to help',
                description: 'Here is the information',
                images: ['test2.jpg'],
            })
            .expect(httpStatus.CONFLICT)
    })
})
