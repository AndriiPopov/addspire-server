const express = require('express')
const { utilsController } = require('../../controllers')
const validate = require('../../middlewares/validate')
const { utilsValidation } = require('../../validations')

const router = express.Router()

router.route('/coins-tomorrow').get(utilsController.coinsTomorrow)

router.route('/available-languages').get(utilsController.availableLanguages)

router
    .route('/get-locale')
    .get(validate(utilsValidation.getLocale), utilsController.getLocale)

module.exports = router
