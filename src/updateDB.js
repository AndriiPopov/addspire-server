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

const clubsToDel = [
    '6203e919242a4b7dbef4d452',
    '6203a85b242a4b7dbef4d1d7',
    '61fed3cc032d5ddd5789ec67',
    '61f3e804e73d2b6fc5c07995',
    '61f2591714695c56696eb5e8',
    '61f14b442df4e044bfa2dc0c',
    '61f12df82df4e044bfa2da44',
    '61f1bc3914695c56696eb449',
]

mongoose
    .connect(config.mongoose.url, config.mongoose.options)
    .then(async () => {
        let res = await Reputation.deleteMany(
            { club: { $nin: clubsToDel } },
            { useFindAndModify: false }
        )
        console.log('reps ', res.count)

        res = await Club.deleteMany(
            { _id: { $nin: clubsToDel } },
            { useFindAndModify: false }
        )
        console.log('club ', res.count)

        res = await Question.deleteMany(
            { club: { $nin: clubsToDel } },
            { useFindAndModify: false }
        )
        console.log('questions ', res.count)

        res = await Answer.deleteMany(
            { club: { $nin: clubsToDel } },
            { useFindAndModify: false }
        )
        console.log('answer ', res.count)

        res = await Comment.deleteMany(
            { club: { $nin: clubsToDel } },
            { useFindAndModify: false }
        )
        console.log('comment ', res.count)

        res = await ImageData.deleteMany(
            { club: { $nin: clubsToDel } },
            { useFindAndModify: false }
        )
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
