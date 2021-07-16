const express = require('express')
const { voteController } = require('../../controllers')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { voteValidation } = require('../../validations')

const router = express.Router()

router
    .route('/accept')
    .post(
        validate(voteValidation.acceptAnswer),
        auth(),
        voteController.acceptAnswer
    )

router
    .route('/vote')
    .post(validate(voteValidation.vote), auth(), voteController.vote)

module.exports = router
