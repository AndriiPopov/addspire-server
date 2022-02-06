const mongoose = require('mongoose')

const config = require('./config/config')
const { Club } = require('./models')

mongoose
    .connect(config.mongoose.url, config.mongoose.options)
    .then(async () => {
        const res = await Club.updateMany({
            $set: { pinned: [] },
        })
        console.log(res)
    })

const exitHandler = () => {
    process.exit(1)
}

const unexpectedErrorHandler = (error) => {
    console.log(error)
    exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)
