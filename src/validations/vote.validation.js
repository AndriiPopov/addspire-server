const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const acceptAnswer = {
    body: Joi.object()
        .keys({
            answerId: Joi.objectId().required(),
        })
        .unknown(true),
}

const vote = {
    body: Joi.object()
        .keys({
            minus: Joi.boolean().optional(),
            resourceId: Joi.objectId().required(),
            type: Joi.string()
                .valid('question', 'answer', 'comment')
                .required(),
        })
        .unknown(true),
}

module.exports = {
    vote,
    acceptAnswer,
}
