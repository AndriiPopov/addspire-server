const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const general = {
    body: [
        // General search
        Joi.object().keys({
            page: Joi.number().optional(),
            tags: Joi.array().items(Joi.string()).optional(),
            name: Joi.string().optional(),
            type: Joi.string()
                .valid('club', 'question', 'reputation', 'account')
                .required(),
            sort: Joi.object()
                .keys({
                    date: Joi.number().valid(-1, 1).optional(),
                    vote: Joi.number().valid(-1, 1).optional(),
                })
                .optional(),
        }),
        // Club search
        Joi.object().keys({
            page: Joi.number().optional(),
            tags: Joi.array().items(Joi.string()).optional(),
            name: Joi.string().optional(),
            clubId: Joi.objectId().required(),
            type: Joi.string().valid('question', 'reputation').required(),
        }),
        // Club search
        Joi.object().keys({
            page: Joi.number().optional(),
            tags: Joi.array().items(Joi.string()).optional(),
            name: Joi.string().optional(),
            clubId: Joi.objectId().required(),
            type: Joi.string().valid('question', 'reputation').required(),
            sort: Joi.object()
                .keys({
                    date: Joi.number().valid(-1, 1).optional(),
                    vote: Joi.number().valid(-1, 1).optional(),
                })
                .optional(),
        }),
        // User search (my clubs)
        Joi.object().keys({
            page: Joi.number().optional(),
            clubName: Joi.string().optional(),
            ownerId: Joi.objectId().required(),
            type: Joi.string().valid('reputation').required(),
        }),
        Joi.object().keys({
            page: Joi.number().optional(),
            ownerId: Joi.objectId().required(),
            starred: Joi.boolean().required(),
            type: Joi.string().valid('reputation').required(),
        }),
        // User search (my questions)
        Joi.object().keys({
            page: Joi.number().optional(),
            name: Joi.string().optional(),
            ownerId: Joi.objectId().required(),
            type: Joi.string().valid('question').required(),
        }),
        Joi.object().keys({
            page: Joi.number().optional(),
            name: Joi.string().optional(),
            followerId: Joi.objectId().required(),
            type: Joi.string().valid('question').required(),
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
    ],
}

module.exports = {
    general,
}
