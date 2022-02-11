const Joi = require('joi')
const { JoiLength } = require('../config/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)

const tagsValidation = Joi.array()
    .items(Joi.string().min(JoiLength.tag.min).max(JoiLength.tag.max))
    .min(1)
    .max(1)
    .optional()

const general = {
    body: [
        // General search
        Joi.object().keys({
            page: Joi.number().optional(),
            tags: tagsValidation,
            // name: Joi.string().optional(),
            type: Joi.string()
                .valid('club', 'question', 'reputation', 'account')
                .required(),
            sort: Joi.object()
                .keys({
                    date: Joi.number().valid(-1, 1).optional(),
                    vote: Joi.number().valid(-1, 1).optional(),
                })
                .optional(),
            global: Joi.boolean().optional(),
            post: Joi.boolean().optional(),
            location: Joi.object()
                .keys({
                    longitude: Joi.number().min(-180).max(180).required(),
                    latitude: Joi.number().min(-90).max(90).required(),
                    distance: Joi.number().min(1).max(500).required(),
                })
                .when('global', {
                    is: Joi.exist(),
                    then: Joi.optional(),
                    otherwise: Joi.required(),
                }),
        }),
        // Club search
        Joi.object().keys({
            page: Joi.number().optional(),
            tags: tagsValidation,
            // name: Joi.string().optional(),
            post: Joi.boolean().optional(),
            clubId: Joi.objectId().required(),
            type: Joi.string().valid('question', 'reputation').required(),
        }),
        // Club search
        Joi.object().keys({
            page: Joi.number().optional(),
            tags: tagsValidation,
            // name: Joi.string().optional(),
            post: Joi.boolean().optional(),
            clubId: Joi.objectId().required(),
            type: Joi.string().valid('question', 'reputation').required(),
            sort: Joi.object()
                .keys({
                    date: Joi.number().valid(-1, 1).optional(),
                    vote: Joi.number().valid(-1, 1).optional(),
                })
                .optional(),
        }),

        // Banned users
        Joi.object().keys({
            banned: Joi.boolean().required(),
            clubId: Joi.objectId().required(),
            type: Joi.string().valid('reputation').required(),
        }),
        // Club profile search
        Joi.object().keys({
            page: Joi.number().optional(),
            reputationId: Joi.objectId().required(),
            post: Joi.boolean().optional(),
            type: Joi.string()
                .valid('question', 'answer', 'comment')
                .required(),
            sort: Joi.object()
                .keys({
                    date: Joi.number().valid(-1, 1).optional(),
                    vote: Joi.number().valid(-1, 1).optional(),
                })
                .optional(),
        }),
        // Question search
        Joi.object().keys({
            page: Joi.number().optional(),
            questionId: Joi.objectId().required(),
            type: Joi.string().valid('answer').required(),
            sort: Joi.object()
                .keys({
                    date: Joi.number().valid(-1, 1).optional(),
                    vote: Joi.number().valid(-1, 1).optional(),
                })
                .optional(),
        }),

        // User clubs
        Joi.object().keys({
            page: Joi.number().optional(),
            profileId: Joi.objectId().required(),
            type: Joi.string().valid('reputation').required(),
        }),

        // Bookmarked clubs
        Joi.object().keys({
            page: Joi.number().optional(),
            ownerId: Joi.objectId().required(),
            starred: Joi.boolean().required(),
            type: Joi.string().valid('reputation').required(),
        }),

        // Bookmarked questions
        Joi.object().keys({
            page: Joi.number().optional(),
            post: Joi.boolean().optional(),
            type: Joi.string().valid('question').required(),
            idIn: Joi.array().items(Joi.objectId()).required(),
            // sort: Joi.object()
            //     .keys({
            //         date: Joi.number().valid(-1, 1).optional(),
            //         vote: Joi.number().valid(-1, 1).optional(),
            //     })
            //     .optional(),
        }),
    ],
}

module.exports = {
    general,
}
