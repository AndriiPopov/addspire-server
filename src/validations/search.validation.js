const Joi = require('joi')

const general = {
    body: Joi.object().keys({
        page: Joi.number().optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        text: Joi.string().optional(),
        club: Joi.string().optional(),
        type: Joi.string()
            .valid('club', 'resource', 'reputation', 'account')
            .required(),
    }),
}

const reputation = {
    body: Joi.object().keys({
        page: Joi.number().optional(),
        reputationIds: Joi.array().items(Joi.string()).required(),
    }),
}

const question = {
    body: Joi.object(),
}

const answer = {
    body: Joi.object(),
}

module.exports = {
    general,
    reputation,
    question,
    answer,
}
