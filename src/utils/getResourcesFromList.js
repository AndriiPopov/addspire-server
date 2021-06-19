const { get, client } = require('../services/redis.service')

const {
    Account,
    Club,
    Comment,
    Plugin,
    Reputation,
    Resource,
} = require('../models')
// const { redis } = require('../services')

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
                await Promise.all(
                    data.ids.map(async (user) => {
                        if (await get(user)) onlineUsers.push(user)
                    })
                )
                break
            case 'accountD':
                type = 'account'
                model = Account
                fields = 'name image notifications reputations clubsCount __v'
                await Promise.all(
                    data.ids.map(async (user) => {
                        if (await get(user)) onlineUsers.push(user)
                    })
                )

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
                fields =
                    'name image articlesCount questionsCount usersCount notifications admins  __v'
                break

            case 'plugin':
            case 'pluginD':
                type = 'plugin'
                model = Plugin
                break

            case 'reputation':
            case 'reputationD':
                type = 'reputation'
                model = Reputation
                break

            case 'resource':
                type = 'resource'
                model = Resource
                break
            case 'resourceD':
                type = 'resource'
                model = Resource
                fields =
                    'name description appliedChanges suggestedChanges image shortDescription likesCount notifications followersCount  suggestedChangesCount date updated version  __v'
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
