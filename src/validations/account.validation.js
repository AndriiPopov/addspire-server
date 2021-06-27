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

const ban = {
    body: Joi.object().keys({
        banUserId: Joi.string().required(),
        clubId: Joi.string().required(),
        banned: Joi.boolean().required(),
    }),
}

const deleteAccount = {
    body: Joi.object().keys({}),
}

const addBookmark = {
    body: Joi.object().keys({
        type: Joi.string().valid('account', 'club', 'question').required(),
        resourceId: Joi.string().required(),
    }),
}

const removeBookmark = {
    body: Joi.object().keys({
        bookmarkId: Joi.string().required(),
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

module.exports = {
    follow,
    unfollow,
    ban,
    deleteAccount,
    addBookmark,
    removeBookmark,
    editAccount,
}
