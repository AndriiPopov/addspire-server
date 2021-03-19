const { Advice } = require('../models/advice')
const { Community } = require('../models/community')

module.exports = type => {
    let model = null
    switch (type) {
        case 'community':
            model = Community
            break
        case 'advice':
            model = Advice
            break
        default:
            break
    }
    return model
}
