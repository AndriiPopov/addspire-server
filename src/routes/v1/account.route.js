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
    .route('/seen-notification')
    .post(
        validate(accountValidation.seenNotification),
        auth(),
        accountController.seenNotification
    )

router
    .route('/seen-feed')
    .post(
        validate(accountValidation.seenFeed),
        auth(),
        accountController.seenFeed
    )

router
    .route('/save-notification-token')
    .post(
        validate(accountValidation.saveNotificationToken),
        auth(),
        accountController.saveNotificationToken
    )
router
    .route('/remove-notification-token')
    .post(
        validate(accountValidation.removeNotificationToken),
        accountController.removeNotificationToken
    )
router
    .route('/language')
    .post(
        validate(accountValidation.language),
        auth(),
        accountController.language
    )

router
    .route('/visit-club')
    .post(
        validate(accountValidation.visitClub),
        auth(),
        accountController.visitClub
    )

module.exports = router
