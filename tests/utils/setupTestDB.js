const url = require('url')
const { Club, Question, Answer } = require('../../src/models')
const { System } = require('../../src/models/system.model')

const {
    userCreationService,
    clubService,
    questionService,
    answerService,
    voteService,
    commentService,
    accountService,
} = require('../../src/services')
const { client } = require('../../src/services/redis.service')
const dbHandler = require('./db-handler')

async function shutdown() {
    await new Promise((resolve) => {
        client.quit(() => {
            resolve()
        })
    })
    // redis.quit() creates a thread to close the connection.
    // We wait until all threads have been run once to ensure the connection closes.
    await new Promise((resolve) => setImmediate(resolve))
}

const createUser = async (id, cb) => {
    await userCreationService.createUserFB(
        {
            id,
            displayName: 'Andrii Popov',
            email: 'andrii@gmail.com',
            picture: 'andrii.jpeg',
            photos: [{ value: 'andrii.jpeg' }],
        },
        cb
    )
}

const addResident = async (clubId, resId, id) => {
    await accountService.follow({
        account: { _id: id._id },
        body: { resourceId: clubId, type: 'club' },
    })
    await clubService.addResident({
        account: { _id: resId._id },
        body: { clubId, residentId: id._id },
    })
}

const setupTestDB = () => {
    beforeAll(async () => {
        await dbHandler.connect()
    })

    beforeEach(async () => {
        let system = await System.findOne({ name: 'system' })
        if (!system) {
            system = new System({
                currentId: 0,
                currentImgId: 0,
            })
            await system.save()
        }

        let user0
        let user1
        let user2
        let user3
        let user4
        let user5

        await createUser(0, (_empty, account) => {
            user0 = account
        })
        await createUser(1, (_empty, account) => {
            user1 = account
        })
        await createUser(2, (_empty, account) => {
            user2 = account
        })
        await createUser(3, (_empty, account) => {
            user3 = account
        })
        await createUser(4, (_empty, account) => {
            user4 = account
        })
        await createUser(5, (_empty, account) => {
            user5 = account
        })
        await createUser(6, () => {})
        await createUser(7, () => {})
        await createUser(8, () => {})
        await createUser(9, () => {})
        await createUser(10, () => {})
        await createUser(11, () => {})

        await clubService.createClub({
            account: { _id: user0._id },
            body: {
                name: 'Test club 1',
                description: 'This is a test club',
                image: 'test.jpeg',
                tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
                location: {
                    longitude: 30,
                    latitude: 30,
                },
                clubAddress: 'Test address',
                global: false,
            },
        })

        const club = await Club.findOne({ name: 'Test club 1' })
        const clubId = club._id.toString()

        await addResident(clubId, user0, user3)
        await addResident(clubId, user0, user4)
        await addResident(clubId, user0, user5)

        await questionService.create({
            account: { _id: user0._id },
            body: {
                clubId,
                name: 'Test question Test question',
                description: 'I want to test.',
                images: ['test1.jpg'],
            },
        })

        const question = await Question.findOne({
            name: 'Test question Test question',
        })
        const questionId = question._id.toString()

        await answerService.create({
            account: { _id: user1._id },
            body: {
                description: 'Here is how to test.',
                images: ['test2.jpg'],
                questionId,
            },
        })

        await answerService.create({
            account: { _id: user0._id },
            body: {
                description: 'Self answer to question',
                images: ['test2.jpg'],
                questionId,
            },
        })

        await answerService.create({
            account: { _id: user2._id },
            body: {
                description: 'Here is how to test 2.',
                images: ['test7.jpg'],
                questionId,
            },
        })

        await commentService.createComment({
            account: { _id: user2._id },
            body: {
                text: 'Test comment',
                clubId,
                questionId,
                resourceId: questionId,
                resourceType: 'question',
            },
        })

        await questionService.create({
            account: { _id: user2._id },
            body: {
                clubId,
                name: 'Test question Test question 2',
                description: 'I want to test 2.',
                images: ['test6.jpg'],
            },
        })

        await questionService.create({
            account: { _id: user1._id },
            body: {
                clubId,
                name: 'Test question Test question 3',
                description: 'I want to test 2.',
                images: ['test6.jpg'],
            },
        })
        const question3 = await Question.findOne({
            name: 'Test question Test question 3',
        })
        const questionId3 = question3._id.toString()

        await answerService.create({
            account: { _id: user2._id },
            body: {
                description: 'Here is how to test 3.',
                images: ['test7.jpg'],
                questionId: questionId3,
            },
        })

        const answer3 = await Answer.findOne({
            description: 'Here is how to test 3.',
        })
        const answerId3 = answer3._id.toString()

        await voteService.acceptAnswer({
            account: { _id: user1._id },
            body: {
                answerId: answerId3,
            },
        })
    })

    afterEach(async () => dbHandler.clearDatabase())

    afterAll(async () => {
        await shutdown()
        await dbHandler.closeDatabase()
    })
}

module.exports = setupTestDB
