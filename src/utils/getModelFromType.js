const { Advice } = require('../models/advice')
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
