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

const visitClub = {
    body: Joi.object().keys({
        id: Joi.objectId().required(),
    }),
}

module.exports = {
    follow,
    unfollow,
    deleteAccount,
    starClub,
    seenNotification,
    saveNotificationToken,
    removeNotificationToken,
    seenFeed,
    language,
    visitClub,
}
