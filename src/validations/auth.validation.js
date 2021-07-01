const Joi = require('joi')

const logout = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
}

const refreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
}

const loginApp = {
    body: Joi.object().keys({
        platform: Joi.string().required(),
        code: Joi.string().required(),
        web: Joi.boolean().required(),
    }),
}

module.exports = {
    logout,
    refreshTokens,
    loginApp,
}
