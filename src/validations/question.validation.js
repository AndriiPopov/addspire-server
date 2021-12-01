const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)

const tagsValidation = Joi.array()
    .items(Joi.string().min(JoiLength.tag.min).max(JoiLength.tag.max))
    .min(1)
    .max(20)
    .required()

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
            tags: tagsValidation,
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
            tags: tagsValidation,
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
