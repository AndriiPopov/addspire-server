const express = require('express')
const { clubController } = require('../../controllers')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { clubValidation } = require('../../validations')

const router = express.Router()

router
    .route('/create-club')
    .post(
        validate(clubValidation.createClub),
        auth(),
        clubController.createClub
    )

module.exports = router
