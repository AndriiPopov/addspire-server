const httpStatus = require('http-status')
const ApiError = require('../utils/ApiError')
const { get, client } = require('./redis.service')
const { System } = require('../models')
const getDistributeCoinsToday = require('../utils/getDistributeCoinsToday')

const coinsTomorrow = async () => {
    try {
        let coins = await get('coinsTomorrow')
        if (!coins) {
            const system = await System.System.findOne({ name: 'system' })
                .select('date')
                .lean()
                .exec()
            coins = getDistributeCoinsToday(system.date, true)
            client.set('coinsTomorrow', coins)
        }
        return coins
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not found')
        } else throw error
    }
}

const availableLanguages = async () => {
    try {
        return await get('availableLocales_frontend')
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not found')
        } else throw error
    }
}

const getLocale = async (req) => {
    try {
        const { language } = req.query
        const locale = await get(`${language}_frontend_l`)
        const version = await get(`${language}_frontend_v`)
        if (locale && version) {
            return { locale, version }
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not found')
        } else throw error
    }
}

module.exports = {
    coinsTomorrow,
    getLocale,
    availableLanguages,
}
