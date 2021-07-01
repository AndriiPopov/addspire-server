const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/club/create', () => {
    test('should return 201 and successfully create new club if data is ok', async () => {
        const oldUser = await Account.findOne({ facebookProfile: 'f_0' }).lean()
        const userId = oldUser._id
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

        const user = await Account.findOne({ facebookProfile: 'f_0' }).lean()

        expect(oldUser.reputationsCount - user.reputationsCount).toEqual(-1)
        expect(user.followingClubs).toContain(clubId)

        const reputation = await Reputation.findOne({
            club: clubId,
            owner: userId,
        }).lean()
        expect(reputation).not.toBeNull()
        expect(reputation.plusToday).toEqual(0)
        expect(reputation.minusToday).toEqual(0)
        expect(reputation.reputation).toEqual(0)
        expect(reputation.admin).toBeTruthy()
        expect(reputation.banned).toBeFalsy()
        expect(reputation.member).toBeTruthy()
        expect(reputation.starred).toBeFalsy()
        expect(reputation.clubName).toEqual(dbClub.name)
        expect(reputation.clubImage).toEqual(dbClub.image)
        expect(reputation.name).toEqual(user.name)
        expect(reputation.image).toEqual(user.image)
        expect(reputation.profileTags).toEqual(user.tags)

        expect(dbClub.description).toEqual('For all of us')
        expect(dbClub.image).toEqual('roller.jpeg')
        expect(dbClub.followersCount).toEqual(1)
        expect(dbClub.followers).toContain(user._id.toString())
        expect(dbClub.reputationsCount).toEqual(1)
        expect(dbClub.adminsCount).toEqual(1)
        expect(dbClub.tags).toEqual(['club1', 'club2'])

        expect(dbClub.adminReputations).toContain(reputation._id.toString())
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
