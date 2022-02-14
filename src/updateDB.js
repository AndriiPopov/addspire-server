//

const mongoose = require('mongoose')

const config = require('./config/config')
const { Question, Account, Reputation } = require('./models')

mongoose
    .connect(config.mongoose.url, config.mongoose.options)
    .then(async () => {
        let res = await Account.updateMany({
            $set: { topClubVisits: [], lastClubVisits: [] },
        })
        console.log(res)
        res = await Club.updateMany({
            $set: { postsCount: 0 },
        })
        console.log(res)
        res = await Reputation.updateMany({
            $set: { postsCount: 0 },
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
