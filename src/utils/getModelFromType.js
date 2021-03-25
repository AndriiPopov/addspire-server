const { Advice } = require('../models/advice')
const { Board } = require('../models/board')
const { Community } = require('../models/community')
const { People } = require('../models/people')
const { Place } = require('../models/place')

module.exports = type => {
    let model = null
    switch (type) {
        case 'community':
            model = Community
            break
        case 'advice':
            model = Advice
            break
        case 'board':
            model = Board
            break
        case 'people':
            model = People
            break
        case 'place':
            model = Place
            break
        default:
            break
    }
    return model
}

module.exports.getPrefix = type => {
    let prefix = ''
    switch (type) {
        case 'advice':
            prefix = 'advices'
            break
        case 'board':
            prefix = 'boards'
            break
        case 'people':
            prefix = 'people'
            break
        case 'place':
            prefix = 'places'
            break
        default:
            break
    }
    return prefix
}
