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
    .then(async () => {
        let res = await Reputation.deleteMany({}, { useFindAndModify: false })
        console.log('reps ', res.count)

        res = await Club.deleteMany({}, { useFindAndModify: false })
        console.log('club ', res.count)

        res = await Question.deleteMany({}, { useFindAndModify: false })
        console.log('questions ', res.count)

        res = await Answer.deleteMany({}, { useFindAndModify: false })
        console.log('answer ', res.count)

        res = await Comment.deleteMany({}, { useFindAndModify: false })
        console.log('comment ', res.count)

        res = await ImageData.deleteMany({}, { useFindAndModify: false })
        console.log('imagedata ', res.count)
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
