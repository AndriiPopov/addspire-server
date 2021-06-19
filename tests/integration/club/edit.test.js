const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club } = require('../../../src/models')

setupTestDB()

describe('POST /api/club/edit', () => {
    test('should return 201 and successfully edit existing club if data is ok', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        await request(app)
            .post('/api/club/edit')
            .set('accountId', 'f_0')
            .send({
                clubId: oldClub._id,
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                startConversation: '100',
                tags: ['club1', 'club2'],
            })
            .expect(httpStatus.CREATED)

        const dbClub = await Club.findById(oldClub._id).lean()
        expect(dbClub).toBeDefined()

        expect(dbClub.name).toEqual('Rollers of US')
        expect(dbClub.description).toEqual('For all of us')
        expect(dbClub.image).toEqual('roller.jpeg')
        expect(dbClub.activated).toBeFalsy()
        expect(dbClub.startConversation).toEqual('100')
        expect(dbClub.tags).toEqual(['club1', 'club2'])
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
                startConversation: '100',
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
                startConversation: '100',
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
                startConversation: '100',
            })
            .expect(httpStatus.BAD_REQUEST)
        await request(app)
            .post('/api/club/edit')
            .set('accountId', 'f_0')
            .send({
                clubId: oldClub._id,
                name: 'Rollers of US',
                description: 'For all of us',
                image: 'roller.jpeg',
                startConversation: '101',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
