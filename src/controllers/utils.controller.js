const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')

const { utilsService } = require('../services')

const availableLanguages = catchAsync(async (req, res) => {
    const languages = await utilsService.availableLanguages()
    res.status(httpStatus.OK).send({
        availableLocales: JSON.parse(languages),
    })
})

const getLocale = catchAsync(async (req, res) => {
    const result = await utilsService.getLocale()
    res.status(httpStatus.OK).send(result)
})

module.exports = {
    availableLanguages,
    getLocale,
}
