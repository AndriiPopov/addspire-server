const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)

const create = {
    body: Joi.object()
        .keys({
            name: Joi.string()
                .required()
                .max(JoiLength.name.max)
                .min(JoiLength.name.min),
            description: Joi.string()
                .required()
                .max(JoiLength.description.max)
                .min(JoiLength.description.min),
            images: Joi.array().items(Joi.string()).optional(),
            clubId: Joi.objectId().required(),
            tags: Joi.array().items(Joi.string()).optional(),
            bonusCoins: Joi.number().optional().min(0),
            bookmark: Joi.boolean().optional(),
        })
        .unknown(true),
}

const edit = {
    body: Joi.object()
        .keys({
            name: Joi.string()
                .required()
                .max(JoiLength.name.max)
                .min(JoiLength.name.min),
            description: Joi.string()
                .required()
                .max(JoiLength.description.max)
                .min(JoiLength.description.min),
            images: Joi.array().items(Joi.string()).optional(),
            tags: Joi.array().items(Joi.string()).optional(),
            resourceId: Joi.objectId().required(),
            bonusCoins: Joi.number().optional().min(0),
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
