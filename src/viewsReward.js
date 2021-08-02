const mongoose = require('mongoose')
const schedule = require('node-schedule')
const config = require('./config/config')

const { viewsRewardService } = require('./services')

const viewsReward = async () => {
    await mongoose.connect(config.mongoose.url, config.mongoose.options)
    await viewsRewardService.viewsReward()
    await mongoose.connection.close()
}

viewsReward()

// Schedule replenish of reputation, minusToday and plusToday
schedule.scheduleJob('0 * * *', viewsReward)
