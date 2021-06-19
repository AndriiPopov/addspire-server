const express = require('express')
const auth = require('../../middlewares/auth')
const mediaController = require('../../controllers/media.controller')

const router = express.Router()

router.route('/sign-s3').post(auth(), mediaController.signS3)

module.exports = router
