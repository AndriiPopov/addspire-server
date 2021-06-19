const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')

const createComment = {
    body: Joi.object().keys({
        text: Joi.string()
            .min(JoiLength.message.min)
            .max(JoiLength.message.max)
            .required(),
        resourceId: Joi.string().required(),
    }),
}

const editComment = {
    body: Joi.object().keys({
        text: Joi.string()
            .required()
            .min(JoiLength.message.min)
            .max(JoiLength.message.max),
        commentId: Joi.string().required(),
    }),
}

const deleteComment = {
    body: Joi.object().keys({
        commentId: Joi.string().required(),
    }),
}

module.exports = {
    createComment,
    editComment,
    deleteComment,
}
