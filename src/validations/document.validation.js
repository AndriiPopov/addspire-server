const Joi = require('joi')
const resources = require('../config/resources')
Joi.objectId = require('joi-objectid')(Joi)

const getDocument = {
    body: Joi.object().keys({
        type: Joi.string()
            .required()
            .valid(...resources),
        ids: Joi.array().items(Joi.objectId()).required(),
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
