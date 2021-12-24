const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')

const { utilsService } = require('../services')

const coinsTomorrow = catchAsync(async (req, res) => {
    const coins = await utilsService.coinsTomorrow()
    res.status(httpStatus.OK).send({
        coinsTomorrow: coins,
    })
})

const availableLanguages = catchAsync(async (req, res) => {
    const languages = await utilsService.availableLanguages()
    res.status(httpStatus.OK).send({
        availableLanguages: languages,
    })
})

const getLocale = catchAsync(async (req, res) => {
    const result = await utilsService.getLocale()
    res.status(httpStatus.OK).send(result)
})

module.exports = {
    coinsTomorrow,
    availableLanguages,
    getLocale,
}
