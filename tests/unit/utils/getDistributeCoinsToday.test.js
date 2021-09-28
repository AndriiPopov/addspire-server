const dayjs = require('dayjs')
const getDistributeCoinsToday = require('../../../src/utils/getDistributeCoinsToday')

describe('getDistributeCoinsToday', () => {
    test('return right value 1', async () => {
        expect(
            Math.floor(getDistributeCoinsToday(dayjs().subtract(1, 'day')))
        ).toEqual(9558)

        let max = 0
        let min = 0

        let last = 0
        let failInDirection = false

        let total = 0

        for (let i = 0; i <= 365 * 2; i += 1) {
            const today = Math.floor(
                getDistributeCoinsToday(dayjs().subtract(i, 'day'))
            )
            if (i === 0) {
                max = today
                min = today
            } else {
                if (today > max) max = today
                if (today < min) min = today
                if (today < last) failInDirection = true
            }
            last = today
            total += today
        }
        expect(max).toEqual(80000)
        expect(min).toEqual(9459)
        expect(failInDirection).toBeFalsy()

        max = 0
        min = 0
        last = 0
        failInDirection = false

        for (let i = 365 * 2; i <= 365 * 4; i += 1) {
            const today = Math.floor(
                getDistributeCoinsToday(dayjs().subtract(i, 'day'))
            )
            if (i === 365 * 2) {
                max = today
                min = today
            } else {
                if (today > max) max = today
                if (today < min) min = today
                if (today > last) {
                    failInDirection = true
                }
            }
            last = today
            total += today
        }
        expect(max).toEqual(80000)
        expect(min).toEqual(2620)
        expect(failInDirection).toBeFalsy()
        expect(total).toEqual(81597206)
    })
})
