const httpStatus = require('http-status')
const { Club } = require('../../../src/models')
const { checkVote } = require('../../../src/utils/checkRights')
const setupTestDB = require('../../utils/setupTestDB')
const { createClubTest } = require('../../utils/requests')

setupTestDB()
describe('Check rights', () => {
    test('should return false if banned', async () => {
        expect(
            await checkVote({ banned: true, reputation: 0 }, 'start')
        ).toBeFalsy()
        expect(
            await checkVote({ banned: true, reputation: 0 }, 'create')
        ).toBeFalsy()
        expect(
            await checkVote({ banned: true, reputation: 0 }, 'plus')
        ).toBeFalsy()
        expect(
            await checkVote({ banned: true, reputation: 0 }, 'minus')
        ).toBeFalsy()
    })

    test('should return true if admin', async () => {
        expect(
            await checkVote({ admin: true, reputation: 0 }, 'start')
        ).toBeTruthy()
        expect(
            await checkVote({ admin: true, reputation: 0 }, 'create')
        ).toBeTruthy()
        expect(
            await checkVote({ admin: true, reputation: 0 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ admin: true, reputation: 0 }, 'minus')
        ).toBeTruthy()
    })

    test('should allow create if reputation is not negative', async () => {
        expect(await checkVote({ reputation: 0 }, 'create')).toBeTruthy()
        expect(await checkVote({ reputation: 10 }, 'create')).toBeTruthy()
        expect(await checkVote({ reputation: -1 }, 'create')).toBeFalsy()
    })

    test('should allow plus if grade allows', async () => {
        // grade 0
        expect(
            await checkVote({ reputation: -1, plusToday: 0 }, 'plus')
        ).toBeFalsy()
        // grade 1
        expect(
            await checkVote({ reputation: 0, plusToday: 0 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 9, plusToday: 4 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 9, plusToday: 5 }, 'plus')
        ).toBeFalsy()
        // grade 2
        expect(
            await checkVote({ reputation: 10, plusToday: 0 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 49, plusToday: 9 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 49, plusToday: 10 }, 'plus')
        ).toBeFalsy()
        // grade 3
        expect(
            await checkVote({ reputation: 50, plusToday: 0 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 99, plusToday: 19 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 99, plusToday: 20 }, 'plus')
        ).toBeFalsy()
        // grade 4
        expect(
            await checkVote({ reputation: 100, plusToday: 0 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 199, plusToday: 29 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 199, plusToday: 30 }, 'plus')
        ).toBeFalsy()
        // grade 5
        expect(
            await checkVote({ reputation: 200, plusToday: 0 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 499, plusToday: 49 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 499, plusToday: 50 }, 'plus')
        ).toBeFalsy()
        // grade 6
        expect(
            await checkVote({ reputation: 500, plusToday: 0 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 999, plusToday: 99 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 999, plusToday: 100 }, 'plus')
        ).toBeFalsy()
        // grade 7
        expect(
            await checkVote({ reputation: 1000, plusToday: 0 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 1100, plusToday: 199 }, 'plus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 1100, plusToday: 200 }, 'plus')
        ).toBeFalsy()
    })

    test('should allow minus if grade allows', async () => {
        // grade 0
        expect(
            await checkVote({ reputation: -1, minusToday: 0 }, 'minus')
        ).toBeFalsy()
        // grade 1
        expect(
            await checkVote({ reputation: 0, minusToday: 0 }, 'minus')
        ).toBeFalsy()
        // grade 2
        expect(
            await checkVote({ reputation: 10, minusToday: 0 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 49, minusToday: 1 }, 'minus')
        ).toBeFalsy()
        // grade 3
        expect(
            await checkVote({ reputation: 50, minusToday: 0 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 99, minusToday: 4 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 99, minusToday: 5 }, 'minus')
        ).toBeFalsy()
        // grade 4
        expect(
            await checkVote({ reputation: 100, minusToday: 0 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 199, minusToday: 9 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 199, minusToday: 10 }, 'minus')
        ).toBeFalsy()
        // grade 5
        expect(
            await checkVote({ reputation: 200, minusToday: 0 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 499, minusToday: 19 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 499, minusToday: 20 }, 'minus')
        ).toBeFalsy()
        // grade 6
        expect(
            await checkVote({ reputation: 500, minusToday: 0 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 999, minusToday: 29 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 999, minusToday: 30 }, 'minus')
        ).toBeFalsy()
        // grade 7
        expect(
            await checkVote({ reputation: 1000, minusToday: 0 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 1100, minusToday: 99 }, 'minus')
        ).toBeTruthy()
        expect(
            await checkVote({ reputation: 1100, minusToday: 100 }, 'minus')
        ).toBeFalsy()
    })

    test('should allow start if club rules allow', async () => {
        const club = await Club.findOne({ name: 'Test club 1' })
        const clubId = club._id.toString()

        expect(
            await checkVote({ reputation: -1, club: clubId }, 'start')
        ).toBeFalsy()
        expect(
            await checkVote({ reputation: 0, club: clubId }, 'start')
        ).toBeTruthy()

        club.startConversation = 10
        await club.save()
        expect(
            await checkVote({ reputation: 9, club: clubId }, 'start')
        ).toBeFalsy()
        expect(
            await checkVote({ reputation: 10, club: clubId }, 'start')
        ).toBeTruthy()

        club.startConversation = 100
        await club.save()
        expect(
            await checkVote({ reputation: 99, club: clubId }, 'start')
        ).toBeFalsy()
        expect(
            await checkVote({ reputation: 100, club: clubId }, 'start')
        ).toBeTruthy()

        club.startConversation = 'resident'
        await club.save()
        expect(
            await checkVote({ reputation: 100, club: clubId }, 'start')
        ).toBeFalsy()
        expect(
            await checkVote(
                { reputation: 100, club: clubId, admin: true },
                'start'
            )
        ).toBeTruthy()
    })
})
