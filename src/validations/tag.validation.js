const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')

const findTags = {
    query: Joi.object().keys({
        tag: Joi.string()
            .required()
            .min(JoiLength.tag.min)
            .max(JoiLength.tag.max),
    }),
}

module.exports = {
    findTags,
}
