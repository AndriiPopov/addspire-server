//

const mongoose = require('mongoose')

const config = require('./config/config')
const {
    Question,
    Account,
    Reputation,
    Club,
    Answer,
    Comment,
    ImageData,
} = require('./models')

mongoose
    .connect(config.mongoose.url, config.mongoose.options)
    .then(async () => {})

const exitHandler = () => {
    process.exit(1)
}

const unexpectedErrorHandler = (error) => {
    console.log(error)
    exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)
