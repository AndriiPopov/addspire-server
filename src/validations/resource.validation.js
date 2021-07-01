const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)

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
            clubId: Joi.objectId().required(),
            type: Joi.string().valid('answer', 'question').required(),
            questionId: Joi.objectId().optional(),
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
            tags: Joi.array().items(Joi.string()).optional(),
            resourceId: Joi.objectId().required(),
            type: Joi.string().valid('answer', 'question').required(),
        })
        .unknown(true),
}

const deleteResource = {
    body: Joi.object()
        .keys({
            resourceId: Joi.objectId().required(),
            type: Joi.string().valid('answer', 'question').required(),
        })
        .unknown(true),
}

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
    createResource,
    editResource,
    deleteResource,
    vote,
    acceptAnswer,
}
