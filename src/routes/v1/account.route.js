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
    .route('/star-club')
    .post(
        validate(accountValidation.starClub),
        auth(),
        accountController.starClub
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

router
    .route('/seen-notification')
    .post(
        validate(accountValidation.seenNotification),
        auth(),
        accountController.seenNotification
    )

router.route('/seen-feed').post(auth(), accountController.seenFeed)

router
    .route('/save-notification-token')
    .post(
        validate(accountValidation.saveNotificationToken),
        auth(),
        accountController.saveNotificationToken
    )

module.exports = router
