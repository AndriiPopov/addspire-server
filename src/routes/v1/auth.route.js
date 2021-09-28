const express = require('express')
const validate = require('../../middlewares/validate')
const authValidation = require('../../validations/auth.validation')
const authController = require('../../controllers/auth.controller')
const auth = require('../../middlewares/auth')

const router = express.Router()

router.post('/logout', validate(authValidation.logout), authController.logout)

router.post('/refresh-tokens', authController.refreshTokens)

router.post(
    '/login-app',
    validate(authValidation.loginApp),
    authController.loginApp
)

router
    .route('/link-account')
    .post(
        validate(authValidation.linkAccount),
        auth(),
        authController.linkAccount
    )

router
    .route('/unlink-account')
    .post(
        validate(authValidation.unlinkAccount),
        auth(),
        authController.unlinkAccount
    )

module.exports = router
