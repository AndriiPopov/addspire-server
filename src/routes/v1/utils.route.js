const express = require('express')
const { utilsController } = require('../../controllers')

const router = express.Router()

router.route('/grades').get(utilsController.getGrades)

module.exports = router
