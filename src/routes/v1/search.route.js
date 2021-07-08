const express = require('express')
const { searchController } = require('../../controllers')
const validate = require('../../middlewares/validate')
const { searchValidation } = require('../../validations')

const router = express.Router()

router
    .route('/general')
    .post(validate(searchValidation.general), searchController.general)

module.exports = router
