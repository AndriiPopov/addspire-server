const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Reputation } = require('../../../src/models')

setupTestDB()

describe('POST /api/club/edit', () => {
    test('should return 201 and successfully edit existing club if data is ok', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })

        const oldReputation = await Reputation.findOne({
            club: oldClub._id,
        }).lean()
        const reputationId = oldReputation._id.toString()

        expect(oldReputation).not.toBeNull()
        expect(oldReputation.clubName).not.toEqual('Rollers of US')
        expect(oldReputation.clubImage).not.toEqual('roller.jpeg')

        await request(app)
            .post('/api/club/edit')
            .set('accountId', 'f_0')
            .send({
                clubId: oldClub._id,
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                tags: ['club1', 'club2'],
            })
            .expect(httpStatus.CREATED)

        const dbClub = await Club.findById(oldClub._id).lean()
        expect(dbClub).toBeDefined()

        expect(dbClub.name).toEqual('Rollers of US')
        expect(dbClub.description).toEqual('For all of us')
        expect(dbClub.image).toEqual('roller.jpeg')
        expect(dbClub.activated).toBeFalsy()
        expect(dbClub.tags).toEqual(['club1', 'club2'])

        const reputation = await Reputation.findById(reputationId).lean()

        expect(reputation).not.toBeNull()
        expect(reputation.clubName).toEqual('Rollers of US')
        expect(reputation.clubImage).toEqual('roller.jpeg')
    })

    test('should return 403 error if  user  not logged', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        await request(app)
            .post('/api/club/edit')
            .send({
                clubId: oldClub._id,
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
            })
            .expect(httpStatus.UNAUTHORIZED)
    })

    test('should return 403 error if is not in the club', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        await request(app)
            .post('/api/club/edit')
            .set('accountId', 'f_1')
            .send({
                clubId: oldClub._id,
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
            })
            .expect(httpStatus.UNAUTHORIZED)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        await request(app)
            .post('/api/club/edit')
            .set('accountId', 'f_0')
            .send({
                clubId: oldClub._id,
                name: 'Rol',
                description: 'For',
                image: 'roller.jpeg',
            })
            .expect(httpStatus.BAD_REQUEST)
        await request(app)
            .post('/api/club/edit')
            .set('accountId', 'f_0')
            .send({
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
