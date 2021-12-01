const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club } = require('../../../src/models')

setupTestDB()

describe('POST /api/club/edit-start-rule', () => {
    test('should return 201 and successfully edit start rule club if data is ok', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        const clubId = oldClub._id.toString()

        const editRule = (rule) =>
            request(app)
                .post('/api/club/edit-start-rule')
                .set('accountId', '0')
                .send({
                    clubId,
                    value: rule,
                })
                .expect(httpStatus.OK)

        await editRule('10')
        const dbClub1 = await Club.findById(clubId).lean()
        expect(dbClub1.startConversation).toEqual('10')

        await editRule('100')
        const dbClub2 = await Club.findById(clubId).lean()
        expect(dbClub2.startConversation).toEqual('100')

        await editRule('resident')
        const dbClub3 = await Club.findById(clubId).lean()
        expect(dbClub3.startConversation).toEqual('resident')

        await editRule('any')
        const dbClub4 = await Club.findById(clubId).lean()
        expect(dbClub4.startConversation).toEqual('any')
    })

    test('should return 400 error if  validation fails', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' })
        await request(app)
            .post('/api/club/edit-start-rule')
            .set('accountId', '0')
            .send({
                clubId: oldClub._id,
                value: 'adsadsad',
            })
            .expect(httpStatus.BAD_REQUEST)
        await request(app)
            .post('/api/club/edit-start-rule')
            .set('accountId', '0')
            .send({
                value: '10',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
