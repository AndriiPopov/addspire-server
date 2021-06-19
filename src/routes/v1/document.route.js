const express = require('express')
const validate = require('../../middlewares/validate')
const documentValidation = require('../../validations/document.validation')
const documentController = require('../../controllers/document.controller')

const router = express.Router()

router
    .route('/poll')
    .post(
        validate(documentValidation.pollDocument),
        documentController.pollResource
    )
router
    .route('/')
    .post(
        validate(documentValidation.getDocument),
        documentController.getResource
    )

module.exports = router
