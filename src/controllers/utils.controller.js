const catchAsync = require('../utils/catchAsync')
const grades = require('../config/grades')
const fieldLength = require('../config/fieldLength')
const value = require('../config/value')
const { get } = require('../services/redis.service')

const getGrades = catchAsync(async (req, res) => {
    res.send({
        grades,
        constValues: value,
        fieldLength: fieldLength.JoiLength,
    })
})

const coinsTomorrow = catchAsync(async (req, res) => {
    const coins = await get('coinsTomorrow')
    res.send({
        coinsTomorrow: coins,
    })
})

module.exports = {
    getGrades,
    coinsTomorrow,
}
