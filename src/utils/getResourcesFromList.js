const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const { Post } = require('../models/post')
const { get } = require('../startup/redis')
const { Board } = require('../models/board')
const { ProgressStep } = require('../models/progressStep')
const { Structure } = require('../models/structure')
const { Version } = require('../models/version')
const { Advice } = require('../models/advice')
const { Step } = require('../models/step')

module.exports = async data => {
    if (data.type && data.ids && data.ids.length > 0) {
        let result
        const onlineUsers = []
        let model
        let fields
        switch (data.type) {
            case 'account':
                model = Account
                for (let user of data.ids)
                    if (await get(user)) onlineUsers.push(user)
                break
            case 'board':
                model = Board
                break
            case 'advice':
                model = Advice
                break
            case 'post':
                model = Post
                break
            case 'progress':
                model = Progress
                break
            case 'progressStep':
                model = ProgressStep
                break
            case 'step':
                model = Step
                break
            case 'structure':
                model = Structure
                break
            case 'version':
                model = Version
                break

            case 'accountD':
                model = Account
                fields =
                    'name image notifications boardsCount likesCount followersCount progressesCount __v'
                for (let user of data.ids)
                    if (await get(user)) onlineUsers.push(user)
                break
            case 'boardD':
                model = Board
                fields =
                    'name image itemsCount trend notifications likesCount savedCount updated owner __v'
                break
            case 'adviceD':
                model = Advice
                fields =
                    'currentVersion owner name image notifications likesCount savedCount updated usersCount __v'
                break
            case 'postD':
                model = Post
                fields = 'notifications __v'
                break
            case 'progressD':
                model = Progress
                break
            case 'progressStepD':
                model = ProgressStep
                fields = 'step description status __v'
                break
            case 'stepD':
                model = Step
                fields = 'name images __v'
                break
            case 'structureD':
                model = Structure
                break
            case 'versionD':
                model = Version
                fields =
                    'name images category published description owner Advice __v'
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
        return [result, onlineUsers]
    }
}
