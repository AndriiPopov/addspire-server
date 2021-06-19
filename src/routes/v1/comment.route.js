const express = require('express')
const { commentController } = require('../../controllers')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { commentValidation } = require('../../validations')

const router = express.Router()

router
    .route('/create')
    .post(
        validate(commentValidation.createComment),
        auth(),
        commentController.createComment
    )

router
    .route('/edit')
    .post(
        validate(commentValidation.editComment),
        auth(),
        commentController.editComment
    )

router
    .route('/delete')
    .post(
        validate(commentValidation.deleteComment),
        auth(),
        commentController.deleteComment
    )

module.exports = router
