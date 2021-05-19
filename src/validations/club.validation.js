const Joi = require('joi')

const createClub = {
    body: Joi.object().keys({
        name: Joi.string().required(),
        description: Joi.string().required(),
        image: Joi.string().required(),
    }),
}

module.exports = {
    createClub,
}
