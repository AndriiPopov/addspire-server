const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)

const create = {
    body: Joi.object()
        .keys({
            description: Joi.string()
                .required()
                .max(JoiLength.description.max)
                .min(JoiLength.description.min),
            images: Joi.array().items(Joi.string()).optional(),
            questionId: Joi.objectId().required(),
            bookmark: Joi.boolean().optional(),
        })
        .unknown(true),
}

const edit = {
    body: Joi.object()
        .keys({
            description: Joi.string()
                .required()
                .max(JoiLength.description.max)
                .min(JoiLength.description.min),
            images: Joi.array().items(Joi.string()).optional(),
            resourceId: Joi.objectId().required(),
        })
        .unknown(true),
}

const remove = {
    body: Joi.object()
        .keys({
            resourceId: Joi.objectId().required(),
        })
        .unknown(true),
}

module.exports = {
    create,
    edit,
    remove,
}
