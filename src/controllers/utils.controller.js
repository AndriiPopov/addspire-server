const catchAsync = require('../utils/catchAsync')
const grades = require('../config/grades')
const fieldLength = require('../config/fieldLength')
const value = require('../config/value')
const { get, client } = require('../services/redis.service')
const { System } = require('../models')
const getDistributeCoinsToday = require('../utils/getDistributeCoinsToday')

const getGrades = catchAsync(async (req, res) => {
    res.send({
        grades,
        constValues: value,
        fieldLength: fieldLength.JoiLength,
    })
})

const coinsTomorrow = catchAsync(async (req, res) => {
    let coins = await get('coinsTomorrow')
    if (!coins) {
        const system = await System.System.findOne({ name: 'system' })
            .select('date')
            .lean()
            .exec()
        coins = getDistributeCoinsToday(system.date, true)
        client.set('coinsTomorrow', coinsTomorrow)
    }

    res.send({
        coinsTomorrow: coins,
    })
})

module.exports = {
    getGrades,
    coinsTomorrow,
}
