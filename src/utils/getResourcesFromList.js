const { get } = require('../services/redis.service')
const { Plugin } = require('../models/plugin.model')
const { Reputation } = require('../models/reputation.model')
const { Club } = require('../models/club.model')
const { Resource } = require('../models/resource.model')
const { Comment } = require('../models/comment.model')
const { Account } = require('../models')

module.exports = async (data) => {
    if (data.type && data.ids && data.ids.length > 0) {
        let result
        const onlineUsers = []
        let model
        let fields
        switch (data.type) {
            case 'account':
                model = Account
                for (const user of data.ids) {
                    if (await get(user)) onlineUsers.push(user)
                }
                break
            case 'accountD':
                model = Account
                fields = 'name image notifications clubsCount __v'
                for (const user of data.ids) {
                    if (user && (await get(user))) onlineUsers.push(user)
                }
                break

            case 'comment':
            case 'commentD':
                model = Comment
                break

            case 'club':
                model = Club
                break
            case 'clubD':
                model = Club
                fields =
                    'name image articlesCount questionsCount usersCount notifications admins  __v'
                break

            case 'plugin':
            case 'pluginD':
                model = Plugin
                break

            case 'reputation':
            case 'reputationD':
                model = Reputation
                break

            case 'resource':
                model = Resource
                break
            case 'resourceD':
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

        return [result, fields, onlineUsers]
    }
}
