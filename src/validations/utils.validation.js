const Joi = require('joi')
// const { JoiLength } = require('../config/fieldLength')

const getLocale = {
    query: Joi.object().keys({
        language: Joi.string().required(),
    }),
}

module.exports = {
    getLocale,
}
