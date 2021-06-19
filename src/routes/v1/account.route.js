const express = require('express')
const { accountController } = require('../../controllers')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { accountValidation } = require('../../validations')

const router = express.Router()

router
    .route('/follow')
    .post(validate(accountValidation.follow), auth(), accountController.follow)

router
    .route('/unfollow')
    .post(
        validate(accountValidation.unfollow),
        auth(),
        accountController.unfollow
    )

router
    .route('/ban')
    .post(validate(accountValidation.ban), auth(), accountController.ban)

router
    .route('/add-bookmark')
    .post(
        validate(accountValidation.addBookmark),
        auth(),
        accountController.addBookmark
    )

router
    .route('/remove-bookmark')
    .post(
        validate(accountValidation.removeBookmark),
        auth(),
        accountController.removeBookmark
    )

router
    .route('/delete')
    .post(
        validate(accountValidation.deleteAccount),
        auth(),
        accountController.deleteAccount
    )

router
    .route('/edit')
    .post(
        validate(accountValidation.editAccount),
        auth(),
        accountController.editAccount
    )

module.exports = router
