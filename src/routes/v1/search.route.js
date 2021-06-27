const express = require('express')
const { searchController } = require('../../controllers')
const validate = require('../../middlewares/validate')
const { searchValidation } = require('../../validations')

const router = express.Router()

router
    .route('/general')
    .post(validate(searchValidation.general), searchController.general)

router
    .route('/question')
    .post(validate(searchValidation.question), searchController.question)

router
    .route('/answer')
    .post(validate(searchValidation.answer), searchController.answer)

router
    .route('/reputation')
    .post(validate(searchValidation.reputation), searchController.reputation)

module.exports = router
