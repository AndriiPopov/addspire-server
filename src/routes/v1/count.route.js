const express = require('express')
const { countController } = require('../../controllers')
const validate = require('../../middlewares/validate')
const { countValidation } = require('../../validations')

const router = express.Router()

router
    .route('/current')
    .post(validate(countValidation.current), countController.current)

module.exports = router
