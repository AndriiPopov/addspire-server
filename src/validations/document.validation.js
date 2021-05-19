const Joi = require('joi');
const resources = require('../config/resources');

const getDocument = {
  body: Joi.object().keys({
    type: Joi.string()
      .required()
      .valid(...resources),
    ids: Joi.array().items(Joi.string()).required(),
  }),
};

const pollDocument = {
  body: Joi.object().keys({
    type: Joi.string()
      .required()
      .valid(...resources),
    id: Joi.string().required(),
    __v: Joi.number().required(),
  }),
};

module.exports = {
  getDocument,
  pollDocument,
};
