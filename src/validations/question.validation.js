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
                .max(JoiLength.questionName.max)
                .min(JoiLength.questionName.min),
            description: Joi.string()
                .required()
                .max(JoiLength.description.max)
                .min(JoiLength.description.min),
            images: Joi.array().items(Joi.string()).optional(),
            clubId: Joi.objectId().required(),
            tags: tagsValidation,
            bookmark: Joi.boolean().optional(),
            post: Joi.boolean().optional(),
        })
        .unknown(true),
}

const edit = {
    body: Joi.object()
        .keys({
            name: Joi.string()
                .required()
                .max(JoiLength.questionName.max)
                .min(JoiLength.questionName.min),
            description: Joi.string()
                .required()
                .max(JoiLength.description.max)
                .min(JoiLength.description.min),
            images: Joi.array().items(Joi.string()).optional(),
            tags: tagsValidation,
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

const pin = {
    body: Joi.object()
        .keys({
            resourceId: Joi.objectId().required(),
            unpin: Joi.boolean().optional(),
        })
        .unknown(true),
}

module.exports = {
    create,
    edit,
    remove,
    pin,
}
