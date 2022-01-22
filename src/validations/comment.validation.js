const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)

const createComment = {
    body: Joi.object().keys({
        text: Joi.string()
            .min(JoiLength.message.min)
            .max(JoiLength.message.max)
            .required(),
        resourceId: Joi.objectId().required(),
        resourceType: Joi.string()
            .valid('answer', 'question', 'imageData')
            .required(),
        bookmark: Joi.boolean().optional(),
    }),
}

const editComment = {
    body: Joi.object().keys({
        text: Joi.string()
            .required()
            .min(JoiLength.message.min)
            .max(JoiLength.message.max),
        commentId: Joi.objectId().required(),
    }),
}

const deleteComment = {
    body: Joi.object().keys({
        commentId: Joi.objectId().required(),
    }),
}

module.exports = {
    createComment,
    editComment,
    deleteComment,
}
