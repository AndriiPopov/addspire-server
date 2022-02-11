const mongoose = require('mongoose')

const config = require('./config/config')
const { Question, Account } = require('./models')

mongoose
    .connect(config.mongoose.url, config.mongoose.options)
    .then(async () => {
        const res = await Question.updateMany({
            $set: { post: false },
        })

        const res2 = await Account.updateMany({
            $set: { topClubVisits: [], lastClubVisits: [] },
        })
        console.log(res)
        console.log(res2)
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
