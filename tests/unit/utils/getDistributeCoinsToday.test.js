const dayjs = require('dayjs')
const getDistributeCoinsToday = require('../../../src/utils/getDistributeCoinsToday')

describe('getDistributeCoinsToday', () => {
    test('return right value 1', async () => {
        expect(
            Math.floor(getDistributeCoinsToday(dayjs().subtract(1, 'day')))
        ).toEqual(9558)
    })
    test('return right value 700', async () => {
        expect(
            Math.floor(getDistributeCoinsToday(dayjs().subtract(1500, 'day')))
        ).toEqual(9558)
    })
})
