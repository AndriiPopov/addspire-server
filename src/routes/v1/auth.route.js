const express = require('express')
const validate = require('../../middlewares/validate')
const authValidation = require('../../validations/auth.validation')
const authController = require('../../controllers/auth.controller')

const router = express.Router()

router.post('/logout', validate(authValidation.logout), authController.logout)
router.post('/refresh-tokens', authController.refreshTokens)

router.post(
    '/login-app',
    validate(authValidation.loginApp),
    authController.loginApp
)

module.exports = router
