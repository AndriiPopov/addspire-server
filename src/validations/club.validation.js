const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')

const createClub = {
    body: Joi.object().keys({
        name: Joi.string()
            .required()
            .min(JoiLength.name.min)
            .max(JoiLength.name.max),
        description: Joi.string()
            .required()
            .min(JoiLength.description.min)
            .max(JoiLength.description.max),
        image: Joi.string().optional(),

        tags: Joi.array().items(Joi.string()).optional(),
    }),
}

const editClub = {
    body: Joi.object().keys({
        name: Joi.string()
            .required()
            .min(JoiLength.name.min)
            .max(JoiLength.name.max),
        description: Joi.string()
            .required()
            .min(JoiLength.description.min)
            .max(JoiLength.description.max),
        image: Joi.string().optional(),
        clubId: Joi.string().required(),
        tags: Joi.array().items(Joi.string()).optional(),
    }),
}

const invite = {
    body: Joi.object().keys({
        clubId: Joi.string().required(),
    }),
}

const acceptInvite = {
    body: Joi.object().keys({
        code: Joi.string().required(),
    }),
}

const addResident = {
    body: Joi.object().keys({
        clubId: Joi.string().required(),
        residentId: Joi.string().required(),
    }),
}

const leaveResidence = {
    body: Joi.object().keys({
        clubId: Joi.string().required(),
    }),
}

const requestResidence = {
    body: Joi.object().keys({
        clubId: Joi.string().required(),
        message: Joi.string()
            .required()
            .min(JoiLength.message.min)
            .max(JoiLength.message.max),
        contact: Joi.string()
            .required()
            .min(JoiLength.message.min)
            .max(JoiLength.message.max),
    }),
}

const acceptResidenceRequest = {
    body: Joi.object().keys({
        clubId: Joi.string().required(),
        requestId: Joi.string().required(),
        residentId: Joi.string().required(),
    }),
}

const declineResidenceRequest = {
    body: Joi.object().keys({
        clubId: Joi.string().required(),
        requestId: Joi.string().required(),
        residentId: Joi.string().required(),
    }),
}

const editStartRule = {
    body: Joi.object().keys({
        clubId: Joi.string().required(),
        value: Joi.string().required().valid('any', '10', '100', 'resident'),
    }),
}

const ban = {
    body: Joi.object().keys({
        clubId: Joi.string().required(),
        reputationId: Joi.string().required(),
        banning: Joi.boolean().optional(),
    }),
}

const editReputation = {
    body: Joi.object().keys({
        reputationId: Joi.string().required(),
        description: Joi.string()
            .required()
            .min(JoiLength.description.min)
            .max(JoiLength.description.max),
        tags: Joi.array().items(Joi.string()).optional(),
    }),
}

module.exports = {
    createClub,
    editClub,
    invite,
    acceptInvite,
    addResident,
    leaveResidence,
    requestResidence,
    acceptResidenceRequest,
    declineResidenceRequest,
    editStartRule,
    ban,
    editReputation,
}
