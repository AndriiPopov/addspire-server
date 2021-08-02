const mongoose = require('mongoose')
const schedule = require('node-schedule')
const config = require('./config/config')
const { replenishService } = require('./services')

const replenish = async () => {
    try {
        await mongoose.connect(config.mongoose.url, config.mongoose.options)
        await replenishService.replenish()
        await mongoose.connection.close()
    } catch (err) {
        setTimeout(replenish, 600000)
    }
}

replenish()

// Schedule replenish of reputation, minusToday and plusToday
schedule.scheduleJob('2 * * *', replenish)
