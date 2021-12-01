const request = require('supertest')
const httpStatus = require('http-status')

const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')
const { createClubTest } = require('../../utils/requests')

setupTestDB()

describe('POST /api/club/create', () => {
    test('should return 201 and successfully create new club if data is ok', async () => {
        const oldUser = await Account.findOne({ facebookProfile: '0' }).lean()
        const userId = oldUser._id

        await createClubTest('0', {
            name: 'Rollers of USw',
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

        const dbClub = await Club.findOne({ name: 'Rollers of USw' }).lean()
        expect(dbClub).toBeDefined()

        const clubId = dbClub._id.toString()

        const user = await Account.findOne({ facebookProfile: '0' }).lean()

        const reputation = await Reputation.findOne({
            club: clubId,
            owner: userId,
        }).lean()

        expect(oldUser.reputationsCount - user.reputationsCount).toEqual(-1)
        expect(user.followingClubs).toContain(clubId)
        expect(oldUser.reputations.length - user.reputations.length).toEqual(-1)

        const reputationRef = user.reputations.find(
            (rep) => rep.club === clubId
        )
        expect(reputationRef).toMatchObject({
            club: clubId,
            reputation: reputation._id.toString(),
        })

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
        expect(reputation.location).toEqual(dbClub.location)
        expect(reputation.clubAddress).toEqual(dbClub.clubAddress)
        expect(reputation.global).toEqual(dbClub.global)

        expect(dbClub.description).toEqual('For all of us')
        expect(dbClub.fresh).toBeTruthy()
        expect(dbClub.image).toEqual('roller.jpeg')
        expect(dbClub.followersCount).toEqual(1)
        expect(dbClub.followers).toContain(user._id.toString())
        expect(dbClub.reputationsCount).toEqual(1)
        expect(dbClub.adminsCount).toEqual(1)
        expect(dbClub.tags).toEqual([
            'club1',
            'club2',
            'club3',
            'club4',
            'club5',
            'club6',
        ])
        expect(dbClub.clubAddress).toEqual('Monte Carlo')
        expect(dbClub.location).toMatchObject({
            coordinates: [30, 30],
            type: 'Point',
        })
        expect(dbClub.global).toBeFalsy()

        expect(dbClub.adminReputations).toContain(reputation._id.toString())

        await createClubTest('0', {
            name: 'Rollers of US',
            description: 'For all of us',
            image: 'roller.jpeg',
            tags: ['club1', 'club2', 'club3', 'club4', 'club5', 'club6'],
            location: null,
            global: true,
        })
        await createClubTest('0', {
            name: 'Rollers of US',
            description: 'For all of us',
            image: 'roller.jpeg',
            tags: ['club1', 'club2', 'club3', 'club4', 'club5', 'club6'],
            global: true,
        })

        await createClubTest(
            '0',
            {
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                tags: ['club1', 'club2', 'club3', 'club4'],
                global: true,
            },
            httpStatus.BAD_REQUEST
        )
        await createClubTest(
            '0',
            {
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                global: true,
            },
            httpStatus.BAD_REQUEST
        )
        await createClubTest(
            '0',
            {
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                global: true,
                tags: [
                    'club1',
                    'club2',
                    'club3',
                    'club4',
                    'club1',
                    'club2',
                    'club3',
                    'club4',
                    'club1',
                    'club2',
                    'club3',
                    'club4',
                    'club1',
                    'club2',
                    'club3',
                    'club4',
                    'club1',
                    'club2',
                    'club3',
                    'club4',
                    'club1',
                    'club2',
                    'club3',
                    'club4',
                    'club1',
                    'club2',
                    'club3',
                    'club4',
                    'club1',
                    'club2',
                    'club3',
                    'club4',
                    'club1',
                    'club2',
                    'club3',
                    'club4',
                ],
            },
            httpStatus.BAD_REQUEST
        )
    })

    test('should return 403 error if  user  not logged', async () => {
        await request(app)
            .post('/api/club/create')
            .send({
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                location: null,
                global: true,
                tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
            })
            .expect(httpStatus.UNAUTHORIZED)
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/club/create')
            .set('accountId', '0')
            .send({
                name: 'Rol',
                description: 'For ',
                image: 'roller.jpeg',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
