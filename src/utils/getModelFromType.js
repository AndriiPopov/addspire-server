const {
    Account,
    Resource,
    Reputation,
    Plugin,
    Comment,
    Club,
} = require('../models')

module.exports = (type) => {
    let model = null
    switch (type) {
        case 'account':
        case 'accountD':
            model = Account
            break
        case 'comment':
        case 'commentD':
            model = Comment
            break
        case 'club':
        case 'clubD':
            model = Club
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
        case 'resourceD':
        case 'question':
        case 'article':
            model = Resource
            break
        default:
            break
    }
    return model
}

module.exports.getPrefix = (type) => {
    let prefix = ''
    switch (type) {
        case 'question':
            prefix = 'questions'
            break
        case 'article':
            prefix = 'articles'
            break
        default:
            break
    }
    return prefix
}
