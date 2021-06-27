const express = require('express')
const { resourceController } = require('../../controllers')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { resourceValidation } = require('../../validations')

const router = express.Router()

router
    .route('/create')
    .post(
        validate(resourceValidation.createResource),
        auth(),
        resourceController.createResource
    )

router
    .route('/edit')
    .post(
        validate(resourceValidation.editResource),
        auth(),
        resourceController.editResource
    )

router
    .route('/delete')
    .post(
        validate(resourceValidation.deleteResource),
        auth(),
        resourceController.deleteResource
    )

router
    .route('/accept')
    .post(
        validate(resourceValidation.acceptAnswer),
        auth(),
        resourceController.acceptAnswer
    )

router
    .route('/vote')
    .post(validate(resourceValidation.vote), auth(), resourceController.vote)

module.exports = router
