const express = require('express')
const { questionController } = require('../../controllers')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { questionValidation } = require('../../validations')

const router = express.Router()

router
    .route('/create')
    .post(
        validate(questionValidation.create),
        auth(),
        questionController.create
    )

router
    .route('/edit')
    .post(validate(questionValidation.edit), auth(), questionController.edit)

router
    .route('/delete')
    .post(
        validate(questionValidation.remove),
        auth(),
        questionController.remove
    )

router
    .route('/pin')
    .post(validate(questionValidation.pin), auth(), questionController.pin)

module.exports = router
