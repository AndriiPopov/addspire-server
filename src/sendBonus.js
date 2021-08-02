const mongoose = require('mongoose')
const schedule = require('node-schedule')
const config = require('./config/config')

const { System, Question } = require('./models')
const distributeBonus = require('./utils/distributeBonus')

const getTodayDate = () => {
    const today = new Date()
    return today.toDateString()
}

const sendBonus = async () => {
    await mongoose.connect(config.mongoose.url, config.mongoose.options)
    const system = await System.System.findOne({ name: 'system' })
        .select('lastSendBonusDate')
        .lean()
        .exec()
    if (!system) setTimeout(sendBonus, 30000)

    if (
        !system.lastSendBonusDate ||
        getTodayDate() !== system.lastSendBonusDate
    ) {
        const questions = await Question.find({
            bonusPending: true,
            bonusCreatedDate: {
                $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
        })
            .select(
                'name bonusPaid bonusPending bonusCoins count acceptedAnswerOwner'
            )
            .lean()
            .exec()

        await Promise.all(
            questions.map(async (question) => {
                await distributeBonus(question)
            })
        )

        await System.System.updateOne(
            { name: 'system' },
            {
                $set: {
                    lastSendBonusDate: getTodayDate(),
                },
            },
            { useFindAndModify: false }
        )

        await mongoose.connection.close()
    }
}

sendBonus()
// Schedule replenish of reputation, minusToday and plusToday
schedule.scheduleJob('1 * * *', sendBonus)
