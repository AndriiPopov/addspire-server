const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/club/create', () => {
    test('should return 201 and successfully create new club if data is ok', async () => {
        const oldUser = await Account.findOne({ facebookProfile: 'f_0' })
        const res = await request(app)
            .post('/api/club/create')
            .set('accountId', 'f_0')
            .send({
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                tags: ['club1', 'club2'],
            })
            .expect(httpStatus.CREATED)

        expect(res.body).toEqual({
            redirect: expect.anything(),
            message: 'created',
        })

        const dbClub = await Club.findOne({ name: 'Rollers of US' }).lean()
        expect(dbClub).toBeDefined()

        const clubId = dbClub._id.toString()

        const user = await Account.findOne({ facebookProfile: 'f_0' })

        expect(oldUser.reputationsCount - user.reputationsCount).toEqual(-1)
        expect(oldUser.reputations.length).toEqual(oldUser.reputationsCount)
        expect(user.reputations.length).toEqual(user.reputationsCount)
        expect(user.followingClubs).toContain(clubId)

        const reputation = user.reputations.find(
            (item) => item.clubId === clubId
        )
        expect(reputation).toBeDefined()
        expect(reputation.admin).toBeTruthy()
        expect(reputation.admin).toBeTruthy()

        const reputationObj = await Reputation.findById(reputation.reputationId)
        expect(reputationObj).toBeDefined()
        expect(reputationObj.club).toEqual(clubId)
        expect(reputationObj.owner).toEqual(user._id.toString())
        expect(reputationObj.plusToday).toEqual(0)
        expect(reputationObj.minusToday).toEqual(0)
        expect(reputationObj.reputation).toEqual(0)
        expect(reputationObj.admin).toBeTruthy()
        expect(reputationObj.banned).toBeFalsy()

        expect(dbClub.description).toEqual('For all of us')
        expect(dbClub.image).toEqual('roller.jpeg')
        expect(dbClub.followersCount).toEqual(1)
        expect(dbClub.followers).toContain(user._id.toString())
        expect(dbClub.reputationsCount).toEqual(1)
        expect(dbClub.adminsCount).toEqual(1)
        expect(dbClub.tags).toEqual(['club1', 'club2'])

        const reputationClub = dbClub.reputations.find(
            (item) => item.reputationId === reputation.reputationId
        )
        expect(reputationClub).toBeDefined()
        expect(reputationClub.accountId).toEqual(user._id.toString())
        expect(reputationClub.admin).toBeTruthy()

        const reputationClubA = dbClub.adminReputations.find(
            (item) => item.reputationId === reputation.reputationId
        )
        expect(reputationClubA).toBeDefined()
        expect(reputationClubA.accountId).toEqual(user._id.toString())
    })

    test('should return 201 and successfully create new club with startConversation resident', async () => {
        await request(app)
            .post('/api/club/create')
            .set('accountId', 'f_0')
            .send({
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
            })
            .expect(httpStatus.CREATED)

        const dbClub = await Club.findOne({ name: 'Rollers of US' })
        expect(dbClub).toBeDefined()
    })

    test('should return 403 error if  user  not logged', async () => {
        await request(app)
            .post('/api/club/create')
            .send({
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
            })
            .expect(httpStatus.UNAUTHORIZED)
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/club/create')
            .set('accountId', 'f_0')
            .send({
                name: 'Rol',
                description: 'For ',
                image: 'roller.jpeg',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
