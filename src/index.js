const mongoose = require('mongoose')
const app = require('./app')
const config = require('./config/config')
const logger = require('./config/logger')
const { pushChanges } = require('./services/pushChanges.service')
const { System } = require('./models')
const createDevUsers = require('../dev/createDevUsers')
require('./config/i18next/loadLocales')

let server
mongoose
    .connect(config.mongoose.url, config.mongoose.options)
    .then(async () => {
        logger.info('Connected to MongoDB')
        let system = await System.System.findOne({ name: 'system' })
        if (!system) {
            system = new System.System({
                currentId: 0,
                currentImgId: 0,
            })
            await system.save()
        }

        server = app.listen(config.port, () => {
            logger.info(`Listening to port ${config.port}`)
        })
        // Push changes to long poll requests
        pushChanges()
        if (config.env === 'development') createDevUsers(20)
        // if (config.env === 'test') createDevUsers(1000)
    })

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed')
            process.exit(1)
        })
    } else {
        process.exit(1)
    }
}

const unexpectedErrorHandler = (error) => {
    logger.error(error)
    exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)

process.on('SIGTERM', () => {
    logger.info('SIGTERM received')
    if (server) {
        server.close()
    }
})
