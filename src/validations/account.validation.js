const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')

const follow = {
    body: Joi.object().keys({
        type: Joi.string().valid('reputation', 'club', 'question').required(),
        resourceId: Joi.string().required(),
    }),
}

const unfollow = {
    body: Joi.object().keys({
        type: Joi.string().valid('reputation', 'club', 'question').required(),
        resourceId: Joi.string().required(),
    }),
}

const deleteAccount = {
    body: Joi.object().keys({}),
}

const starClub = {
    body: Joi.object().keys({
        add: Joi.boolean().required(),
        clubId: Joi.string().required(),
    }),
}

const editAccount = {
    body: Joi.object().keys({
        name: Joi.string()
            .optional()
            .min(JoiLength.message.min)
            .max(JoiLength.message.max),
        description: Joi.string()
            .optional()
            .min(JoiLength.description.min)
            .max(JoiLength.description.max),
        contact: Joi.string()
            .optional()
            .min(JoiLength.description.min)
            .max(JoiLength.description.max),
        image: Joi.string().optional(),
        tags: Joi.array().items(Joi.string()).optional(),
    }),
}

const seenNotification = {
    body: Joi.object().keys({
        notId: Joi.string().required(),
    }),
}

module.exports = {
    follow,
    unfollow,
    deleteAccount,
    starClub,
    editAccount,
    seenNotification,
}
