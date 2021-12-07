const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)

const tagsValidationClub = Joi.array()
    .items(Joi.string().min(JoiLength.tag.min).max(JoiLength.tag.max))
    .min(5)
    .max(20)
    .required()

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
        tags: tagsValidationClub,
        global: Joi.boolean().required(),
        location: Joi.object()
            .keys({
                longitude: Joi.number().min(-180).max(180).required(),
                latitude: Joi.number().min(-90).max(90).required(),
            })
            .when('global', {
                is: true,
                then: Joi.allow(null).optional(),
                otherwise: Joi.required(),
            }),
        clubAddress: Joi.string().allow('').optional(),
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
        clubId: Joi.objectId().required(),
        tags: tagsValidationClub,
    }),
}

const invite = {
    body: Joi.object().keys({
        clubId: Joi.objectId().required(),
    }),
}

const acceptInvite = {
    body: Joi.object().keys({
        code: Joi.string().required(),
    }),
}

const addResident = {
    body: Joi.object().keys({
        clubId: Joi.objectId().required(),
        residentId: Joi.objectId().required(),
    }),
}

const leaveResidence = {
    body: Joi.object().keys({
        clubId: Joi.objectId().required(),
    }),
}

const requestResidence = {
    body: Joi.object().keys({
        clubId: Joi.objectId().required(),
        message: Joi.string()
            .required()
            .min(JoiLength.message.min)
            .max(JoiLength.message.max),
    }),
}

const acceptResidenceRequest = {
    body: Joi.object().keys({
        clubId: Joi.objectId().required(),
        requestId: Joi.objectId().required(),
        residentId: Joi.objectId().required(),
    }),
}

const declineResidenceRequest = {
    body: Joi.object().keys({
        clubId: Joi.objectId().required(),
        requestId: Joi.objectId().required(),
        residentId: Joi.objectId().required(),
    }),
}

const editStartRule = {
    body: Joi.object().keys({
        clubId: Joi.objectId().required(),
        value: Joi.string().required().valid('any', '10', '100', 'resident'),
    }),
}

const ban = {
    body: Joi.object().keys({
        clubId: Joi.objectId().required(),
        reputationId: Joi.objectId().required(),
        banning: Joi.boolean().optional(),
    }),
}

const editReputation = {
    body: Joi.object().keys({
        reputationId: Joi.objectId().required(),
        profileId: Joi.objectId().required(),
    }),
}

const getReputationId = {
    body: Joi.object().keys({
        clubId: Joi.objectId().required(),
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
    getReputationId,
}
