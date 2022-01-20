const Joi = require('joi')
const resources = require('../config/resources')
Joi.objectId = require('joi-objectid')(Joi)

const getDocument = {
    body: Joi.object().keys({
        type: Joi.string()
            .required()
            .valid(...resources),
        ids: Joi.array().items(Joi.objectId()).required(),
        ip: Joi.string().optional(),
    }),
}

const pollDocument = {
    body: Joi.object().keys({
        pollResources: Joi.object()
            .keys({
                resources: Joi.object()
                    .pattern(
                        Joi.string().valid(...resources),
                        Joi.object().pattern(
                            Joi.objectId(),
                            Joi.alternatives().try(Joi.number(), Joi.string())
                        )
                    )
                    .required(),
                locales: Joi.array().items(
                    Joi.array()
                        .length(2)
                        .ordered(
                            Joi.string().length(2),
                            Joi.alternatives().try(Joi.number(), Joi.string())
                        )
                        .required()
                ),
                refreshConstants: Joi.boolean().optional(),
                pollRefreshPoll: Joi.number(),
            })
            .required(),
    }),
}

module.exports = {
    getDocument,
    pollDocument,
}
