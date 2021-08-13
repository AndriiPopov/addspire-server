const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const current = {
    body: Joi.object().keys({
        ids: Joi.array().required().items(Joi.objectId()),
    }),
}

module.exports = {
    current,
}
