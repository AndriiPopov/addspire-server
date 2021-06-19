const mongoose = require('mongoose')
const url = require('url')
const { Club, Resource } = require('../../src/models')
const { System } = require('../../src/models/system.model')

const {
    userCreationService,
    clubService,
    resourceService,
    commentService,
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

const createInvite = async (id, clubId) => {
    const inviteLink = await clubService.invite({
        account: id,
        body: { clubId },
    })
    if (inviteLink) {
        const queryData = url.parse(inviteLink, true).query
        return queryData.invite
    }
}

const acceptInvite = async (id, code) => {
    await clubService.acceptInvite({
        account: id,
        body: { code },
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
            account: user0._id,
            body: {
                name: 'Test club 1',
                description: 'This is a test club',
                image: 'test.jpeg',
                tags: ['tag1', 'tag2'],
            },
        })

        const club = await Club.findOne({ name: 'Test club 1' })
        const clubId = club._id.toString()

        await acceptInvite(user3._id, await createInvite(user0._id, clubId))
        await acceptInvite(user4._id, await createInvite(user0._id, clubId))
        await acceptInvite(user5._id, await createInvite(user0._id, clubId))

        await resourceService.createResource({
            account: user0._id,
            body: {
                clubId,
                type: 'question',
                name: 'Test question',
                description: 'I want to test.',
                images: ['test1.jpg'],
            },
        })

        const question = await Resource.findOne({ name: 'Test question' })
        const questionId = question._id.toString()

        await resourceService.createResource({
            account: user1._id,
            body: {
                clubId,
                type: 'answer',
                name: 'Test answer',
                description: 'Here is how to test.',
                images: ['test2.jpg'],
                questionId,
            },
        })

        await resourceService.createResource({
            account: user2._id,
            body: {
                clubId,
                type: 'answer',
                name: 'Test answer number 2',
                description: 'Here is how to test 2.',
                images: ['test7.jpg'],
                questionId,
            },
        })

        await commentService.createComment({
            account: user2._id,
            body: {
                text: 'Test comment',
                clubId,
                questionId,
                resourceId: questionId,
            },
        })

        await resourceService.createResource({
            account: user2._id,
            body: {
                clubId,
                type: 'question',
                name: 'Test question 2',
                description: 'I want to test 2.',
                images: ['test6.jpg'],
            },
        })

        await resourceService.createResource({
            account: user1._id,
            body: {
                clubId,
                type: 'question',
                name: 'Test question 3',
                description: 'I want to test 2.',
                images: ['test6.jpg'],
            },
        })
        const question3 = await Resource.findOne({ name: 'Test question 3' })
        const questionId3 = question3._id.toString()

        await resourceService.createResource({
            account: user2._id,
            body: {
                clubId,
                type: 'answer',
                name: 'Test answer number 3',
                description: 'Here is how to test 2.',
                images: ['test7.jpg'],
                questionId: questionId3,
            },
        })

        const answer3 = await Resource.findOne({ name: 'Test answer number 3' })
        const answerId3 = answer3._id.toString()

        await resourceService.acceptAnswer({
            account: user1._id,
            body: {
                clubId,
                questionId: questionId3,
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
