const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)

const follow = {
    body: Joi.object().keys({
        type: Joi.string().valid('reputation', 'club', 'question').required(),
        resourceId: Joi.objectId().required(),
    }),
}

const unfollow = {
    body: Joi.object().keys({
        type: Joi.string().valid('reputation', 'club', 'question').required(),
        resourceId: Joi.objectId().required(),
    }),
}

const deleteAccount = {
    body: Joi.object().keys({}),
}

const starClub = {
    body: Joi.object().keys({
        add: Joi.boolean().required(),
        clubId: Joi.objectId().required(),
    }),
}

const editAccount = {
    body: Joi.object().keys({
        name: Joi.string()
            .required()
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
        social: Joi.string().optional().max(JoiLength.message.max).allow(''),
        image: Joi.string().optional(),
        background: Joi.string().optional(),
        tags: Joi.array()
            .items(Joi.string().min(JoiLength.tag.min).max(JoiLength.tag.max))
            .max(20)
            .optional(),
    }),
}

const seenNotification = {
    body: Joi.object().keys({
        notId: Joi.string().required(),
    }),
}

const seenFeed = {
    body: Joi.object().keys({
        id: Joi.objectId().required(),
    }),
}

const saveNotificationToken = {
    body: Joi.object().keys({
        token: Joi.string().required(),
    }),
}

const removeNotificationToken = {
    body: Joi.object().keys({
        token: Joi.string().required(),
    }),
}

const language = {
    body: Joi.object().keys({
        language: Joi.string().required(),
    }),
}

module.exports = {
    follow,
    unfollow,
    deleteAccount,
    starClub,
    editAccount,
    seenNotification,
    saveNotificationToken,
    removeNotificationToken,
    seenFeed,
    language,
}
