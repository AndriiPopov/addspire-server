const { client } = require('../services/redis.service')

const {
    Account,
    Club,
    Comment,
    Plugin,
    Reputation,
    Question,
    Answer,
} = require('../models')
const { selectFields } = require('../config/selectFields')

module.exports = async (data) => {
    if (data.type && data.ids && data.ids.length > 0) {
        let result
        const onlineUsers = []
        let model
        let fields
        let type = ''
        switch (data.type) {
            case 'account':
                type = 'account'
                model = Account

                break
            case 'accountD':
                type = 'account'
                model = Account
                fields = selectFields.accountD

                break

            case 'comment':
            case 'commentD':
                type = 'comment'
                model = Comment
                break

            case 'club':
                type = 'club'
                model = Club
                break
            case 'clubD':
                type = 'club'
                model = Club
                fields = selectFields.clubD
                break

            case 'plugin':
            case 'pluginD':
                type = 'plugin'
                model = Plugin
                break

            case 'reputation':
                type = 'reputation'
                model = Reputation
                break
            case 'reputationD':
                type = 'reputation'
                model = Reputation
                fields = selectFields.reputationD
                break

            case 'question':
                type = 'question'
                model = Question
                break
            case 'questionD':
                type = 'question'
                model = Question
                fields = selectFields.questionD
                break

            case 'answer':
                type = 'answer'
                model = Answer
                break
            case 'answerD':
                type = 'answer'
                model = Answer
                fields = selectFields.answerD
                break

            default:
                break
        }

        if (model) {
            if (!fields) {
                result = await model
                    .find({
                        _id: { $in: data.ids },
                    })
                    .lean()
                    .exec()
                if (data.type === 'account') {
                    result.map((doc) => doc.toJSON())
                }
            } else {
                result = await model
                    .find({
                        _id: { $in: data.ids },
                    })
                    .select(fields)
                    .lean()
                    .exec()
            }
        }

        const resources = result.filter((item) => item)
        // Save version to redis for using in poll resources
        await Promise.all(
            resources.map(async (doc) => {
                client.set(`${type}_${doc._id}`, doc.__v, 'EX', 600)
            })
        )

        return [result, fields, onlineUsers]
    }
}
