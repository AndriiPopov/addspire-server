const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)

const createProfile = {
    body: Joi.object().keys({
        label: Joi.string()
            .required()
            .min(JoiLength.name.min)
            .max(JoiLength.name.max),
    }),
}

const editProfile = {
    body: Joi.object().keys({
        name: Joi.string()
            .optional()
            .min(JoiLength.name.min)
            .max(JoiLength.name.max),
        description: Joi.string()
            .optional()
            .max(JoiLength.description.max)
            .allow(''),
        address: Joi.string().optional().max(JoiLength.name.max).allow(''),
        phone: Joi.string().optional().max(JoiLength.name.max).allow(''),
        web: Joi.string().optional().max(JoiLength.name.max).allow(''),
        email: Joi.string().optional().max(JoiLength.name.max).allow(''),
        image: Joi.string().optional().allow(''),
        images: Joi.array().items(Joi.string()).max(20).optional(),
        tags: Joi.array()
            .items(Joi.string().min(JoiLength.tag.min).max(JoiLength.tag.max))
            .max(20)
            .optional(),
        label: Joi.string()
            .optional()
            .min(JoiLength.label.min)
            .max(JoiLength.label.max),
        profileId: Joi.objectId().required(),
        anonym: Joi.boolean().optional(),
    }),
}

const deleteProfile = {
    body: Joi.object().keys({
        profileId: Joi.objectId().required(),
    }),
}

const chooseDefaultProfile = {
    body: Joi.object().keys({
        profileId: Joi.objectId().required(),
    }),
}

module.exports = {
    createProfile,
    editProfile,
    deleteProfile,
    chooseDefaultProfile,
}
