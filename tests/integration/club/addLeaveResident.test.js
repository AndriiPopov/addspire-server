const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Club, Account, Reputation } = require('../../../src/models')
const value = require('../../../src/config/value')

setupTestDB()

describe('POST /api/club/', () => {
    test(`should return 200 and successfully add resident if data is ok,
    fail if thereare more than max admins, 
    return 400 on validation fail`, async () => {
        const oldUser0 = await Account.findOne({ facebookProfile: '0' })
        const userId0 = oldUser0._id.toString()
        const oldUser1 = await Account.findOne({ facebookProfile: '1' })
        const userId1 = oldUser1._id.toString()
        const oldUser2 = await Account.findOne({ facebookProfile: '2' })
        const userId2 = oldUser2._id.toString()
        const oldUser3 = await Account.findOne({ facebookProfile: '3' })
        const userId3 = oldUser3._id.toString()
        const oldUser4 = await Account.findOne({ facebookProfile: '4' })
        const userId4 = oldUser4._id.toString()
        const oldUser5 = await Account.findOne({ facebookProfile: '5' })
        const userId5 = oldUser5._id.toString()
        const oldUser6 = await Account.findOne({ facebookProfile: '6' })
        const userId6 = oldUser6._id.toString()
        const oldUser7 = await Account.findOne({ facebookProfile: '7' })
        const userId7 = oldUser7._id.toString()
        const oldUser8 = await Account.findOne({ facebookProfile: '8' })
        const userId8 = oldUser8._id.toString()
        const oldUser9 = await Account.findOne({ facebookProfile: '9' })
        const userId9 = oldUser9._id.toString()

        await request(app)
            .post('/api/club/create')
            .set('accountId', '0')
            .send({
                name: 'Rollers of USRollers of US',
                description: 'For all of usFor all of usFor all of us',
                image: 'roller.jpeg',
                tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
                location: {
                    longitude: 30,
                    latitude: 30,
                },
                clubAddress: 'Test address',
                global: false,
            })
            .expect(httpStatus.CREATED)

        const club0 = await Club.findOne({ name: 'Rollers of USRollers of US' })
        expect(club0).not.toBeNull()
        const clubId = club0._id.toString()

        const addResident = async (id, residentId, expected) => {
            await request(app)
                .post('/api/club/add-resident')
                .set('accountId', `${id}`)
                .send({
                    clubId,
                    residentId,
                })
                .expect(expected || httpStatus.OK)
        }

        await addResident(1, userId1, httpStatus.UNAUTHORIZED)
        await addResident(0, userId0, httpStatus.CONFLICT)
        await addResident(0, userId1)
        const club1 = await Club.findById(clubId)
        expect(club1).not.toBeNull()
        expect(club1.adminsCount - club0.adminsCount).toEqual(1)

        const reputation1 = await Reputation.findOne({
            club: clubId,
            owner: userId1,
        }).lean()
        const reputationId1 = reputation1._id.toString()

        expect(club1.adminReputations).toContain(reputationId1)

        expect(reputation1.admin).toBeTruthy()

        await addResident(0, userId2)
        await addResident(0, userId3)
        await addResident(3, userId4)
        await addResident(4, userId5)
        await addResident(0, userId6)
        await addResident(0, userId7)
        await addResident(0, userId8, httpStatus.CONFLICT)
        await addResident(0, undefined, httpStatus.BAD_REQUEST)
        await addResident(0, userId9, httpStatus.CONFLICT)

        const club2 = await Club.findById(clubId)
        expect(club2).not.toBeNull()
        expect(club2.adminsCount).toEqual(value.maxAdmins)

        const leaveResidence = async (id, expected, noClub) => {
            await request(app)
                .post('/api/club/leave-residence')
                .set('accountId', `${id}`)
                .send(
                    noClub
                        ? {}
                        : {
                              clubId,
                          }
                )
                .expect(expected || httpStatus.OK)
        }

        await leaveResidence(8, httpStatus.UNAUTHORIZED)
        await leaveResidence(undefined, httpStatus.BAD_REQUEST, true)
        await leaveResidence(1)

        const club3 = await Club.findById(clubId)
        expect(club3).not.toBeNull()
        const reputationObj3 = await Reputation.findById(reputationId1)
        expect(reputationObj3).toBeDefined()
        expect(reputationObj3.admin).toBeFalsy()

        expect(club3.adminReputations).not.toContain(reputationId1)

        expect(club2.adminsCount - club3.adminsCount).toEqual(1)
        expect(club3.adminsCount).toEqual(club3.adminReputations.length)
    })
})
