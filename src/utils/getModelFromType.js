const {
    Account,
    Reputation,
    Plugin,
    Comment,
    Club,
    Question,
    Answer,
    ImageData,
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
        case 'question':
        case 'questionD':
            model = Question
            break
        case 'answer':
        case 'answerD':
            model = Answer
            break
        case 'imageData':
        case 'imageDataD':
            model = ImageData
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
        case 'answer':
            prefix = 'answers'
            break
        default:
            break
    }
    return prefix
}
