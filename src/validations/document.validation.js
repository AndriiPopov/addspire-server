const Joi = require('joi')
const resources = require('../config/resources')

const getDocument = {
    body: Joi.object().keys({
        type: Joi.string()
            .required()
            .valid(...resources),
        ids: Joi.array().items(Joi.string()).required(),
    }),
}

const pollDocument = {
    body: Joi.object().keys({
        pollResources: Joi.object().keys(),
    }),
}

module.exports = {
    getDocument,
    pollDocument,
}
