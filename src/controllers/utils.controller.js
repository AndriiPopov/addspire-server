const catchAsync = require('../utils/catchAsync')

const { get, client } = require('../services/redis.service')
const { System } = require('../models')
const getDistributeCoinsToday = require('../utils/getDistributeCoinsToday')

const coinsTomorrow = catchAsync(async (req, res) => {
    let coins = await get('coinsTomorrow')
    if (!coins) {
        const system = await System.System.findOne({ name: 'system' })
            .select('date')
            .lean()
            .exec()
        coins = getDistributeCoinsToday(system.date, true)
        client.set('coinsTomorrow', coins)
    }

    res.send({
        coinsTomorrow: coins,
    })
})

module.exports = {
    coinsTomorrow,
}
