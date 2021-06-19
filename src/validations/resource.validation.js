const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')

const searchResources = {
    body: Joi.object(),
    // .keys({
    //     name: Joi.string().required(),
    //     description: Joi.string().required(),
    //     image: Joi.string().required(),
    // }),
}

const searchAnswers = {
    body: Joi.object(),
}

const createResource = {
    body: Joi.object()
        .keys({
            name: Joi.string()
                .optional()
                .max(JoiLength.name.max)
                .min(JoiLength.name.min),
            description: Joi.string()
                .required()
                .max(JoiLength.description.max)
                .min(JoiLength.description.min),
            images: Joi.array().items(Joi.string()).optional(),
            clubId: Joi.string().required(),
            type: Joi.string()
                .valid('answer', 'question', 'article')
                .required(),
            questionId: Joi.string().optional(),
            tags: Joi.array().items(Joi.string()).optional(),
        })
        .unknown(true),
}

const editResource = {
    body: Joi.object()
        .keys({
            name: Joi.string()
                .optional()
                .max(JoiLength.name.max)
                .min(JoiLength.name.min),
            description: Joi.string()
                .required()
                .max(JoiLength.description.max)
                .min(JoiLength.description.min),
            images: Joi.array().items(Joi.string()).optional(),
            resourceId: Joi.string().required(),
            tags: Joi.array().items(Joi.string()).optional(),
        })
        .unknown(true),
}

const deleteResource = {
    body: Joi.object()
        .keys({
            resourceId: Joi.string().required(),
            type: Joi.string()
                .valid('answer', 'question', 'article')
                .required(),
        })
        .unknown(true),
}

const acceptAnswer = {
    body: Joi.object()
        .keys({
            answerId: Joi.string().required(),
        })
        .unknown(true),
}

const vote = {
    body: Joi.object()
        .keys({
            minus: Joi.boolean().optional(),
            resourceId: Joi.string().required(),
            type: Joi.string().valid('resource', 'comment').required(),
        })
        .unknown(true),
}

module.exports = {
    searchResources,
    createResource,
    searchAnswers,
    editResource,
    deleteResource,
    vote,
    acceptAnswer,
}
