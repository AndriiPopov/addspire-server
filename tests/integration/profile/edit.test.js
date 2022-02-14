const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Reputation, Club } = require('../../../src/models')
const { createClubTest } = require('../../utils/requests')

setupTestDB()

describe('POST /api/profile/edit', () => {
    test('should return 200 and successfully edit profile', async () => {
        const editData0 = {
            label: 'Profile 22',
            tags: ['profile1', 'profile2'],
            name: 'Jupiter',
            image: 'fernando.jpeg',
            images: ['image1.jpeg', 'image2.jpeg'],
            address: 'kiev',
        }
        const editData1 = {
            name: 'Sergo',
            tags: ['serg'],
            image: 'seryi.jpeg',
            images: ['image3.jpeg', 'image4.jpeg'],
            label: 'Sergs Profile',
        }

        const editData2 = {
            name: 'Marko',
            tags: ['marc'],
            image: 'marko.jpeg',
            images: ['image5.jpeg', 'image6.jpeg'],
            label: 'Marcos Profile',
        }
        const oldUser = await Account.findOne({ facebookProfile: '0' })
        const userId = oldUser._id.toString()

        const oldReputation = await Reputation.findOne({ owner: userId }).lean()
        const reputationId = oldReputation._id.toString()
        // Check simple edit of one profile

        await request(app)
            .post('/api/profile/create')
            .set('accountId', '0')
            .send({
                label: 'Profile 2',
            })
            .expect(httpStatus.OK)

        const user0 = await Account.findById(userId).lean()

        await request(app)
            .post('/api/profile/edit')
            .set('accountId', '0')
            .send({
                ...editData0,
                profileId: user0.profiles[1]._id,
            })
            .expect(httpStatus.OK)

        const user1 = await Account.findById(userId).lean()

        expect(user1.profiles[1]).toMatchObject(editData0)

        // Choose default profile

        await request(app)
            .post('/api/profile/choose-default-profile')
            .set('accountId', '0')
            .send({
                profileId: user1.profiles[1]._id,
            })
            .expect(httpStatus.OK)

        const user2 = await Account.findById(userId).lean()

        expect(user2.profiles[1]._id.toString()).toEqual(
            user2.defaultProfile.toString()
        )

        // Create club and check the new reputation
        await createClubTest('0', {
            name: 'Rollers of USwProfile',
            description: 'For all of us',
            image: 'roller.jpeg',
            tags: ['club1', 'club2', 'club3', 'club4', 'club5', 'club6'],
            location: {
                longitude: 30,
                latitude: 30,
            },
            clubAddress: 'Monte Carlo',
            global: false,
        })

        const dbClub = await Club.findOne({
            name: 'Rollers of USwProfile',
        }).lean()
        expect(dbClub).toBeDefined()

        const clubId = dbClub._id.toString()

        const newReputation = await Reputation.findOne({
            owner: userId,
            club: clubId,
        }).lean()
        const newReputationId = newReputation._id.toString()

        expect(newReputation).toMatchObject({
            tags: ['profile1', 'profile2'],
            name: 'Jupiter',
            image: 'fernando.jpeg',
            label: 'Profile 22',
        })

        // Edit old profile

        await request(app)
            .post('/api/profile/edit')
            .set('accountId', '0')
            .send({
                ...editData1,
                profileId: user2.profiles[0]._id,
                anonym: true,
            })
            .expect(httpStatus.OK)
        const oldReputation1 = await Reputation.findById(reputationId).lean()

        const { images: images1, ...editData1Rep } = editData1
        expect(oldReputation1).toMatchObject(editData1Rep)

        const user11 = await Account.findById(userId).lean()

        expect(user11.profiles[0]).toMatchObject(editData1)

        // Edit new profile

        await request(app)
            .post('/api/profile/edit')
            .set('accountId', '0')
            .send({ ...editData2, profileId: user2.profiles[1]._id })
            .expect(httpStatus.OK)

        const newReputation1 = await Reputation.findById(newReputationId).lean()

        const { images: images2, ...editData2Rep } = editData2
        expect(newReputation1).toMatchObject(editData2Rep)

        const user111 = await Account.findById(userId).lean()

        expect(user111.profiles[1]).toMatchObject(editData2)

        // Set another profile in reputation

        await request(app)
            .post('/api/club/edit-reputation')
            .set('accountId', '0')
            .send({ profileId: user2.profiles[1]._id, reputationId })
            .expect(httpStatus.OK)

        const oldReputation2 = await Reputation.findById(reputationId).lean()

        expect(oldReputation2).toMatchObject(editData2Rep)

        await request(app)
            .post('/api/club/edit-reputation')
            .set('accountId', '0')
            .send({ profileId: user2.profiles[0]._id, reputationId })
            .expect(httpStatus.OK)

        const oldReputation3 = await Reputation.findById(reputationId).lean()

        expect(oldReputation3).toMatchObject(editData1Rep)

        // Delete profile
        await request(app)
            .post('/api/profile/delete')
            .set('accountId', '0')
            .send({ profileId: user2.profiles[1]._id })
            .expect(httpStatus.CONFLICT)

        await request(app)
            .post('/api/profile/delete')
            .set('accountId', '0')
            .send({ profileId: user2.profiles[0]._id })
            .expect(httpStatus.OK)

        const oldReputation4 = await Reputation.findById(reputationId).lean()

        expect(oldReputation4).toMatchObject(editData2Rep)
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/profile/edit')
            .set('accountId', '0')
            .send({
                name: 'T',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
