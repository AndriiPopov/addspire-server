const express = require('express')
const { tagController } = require('../../controllers')
const validate = require('../../middlewares/validate')
const { tagValidation } = require('../../validations')

const router = express.Router()

router
    .route('/find-tags')
    .get(validate(tagValidation.findTags), tagController.findTags)

module.exports = router
