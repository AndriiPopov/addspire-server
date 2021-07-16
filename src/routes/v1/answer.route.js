const express = require('express')
const { answerController } = require('../../controllers')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { answerValidation } = require('../../validations')

const router = express.Router()

router
    .route('/create')
    .post(validate(answerValidation.create), auth(), answerController.create)

router
    .route('/edit')
    .post(validate(answerValidation.edit), auth(), answerController.edit)

router
    .route('/delete')
    .post(validate(answerValidation.remove), auth(), answerController.remove)

module.exports = router
