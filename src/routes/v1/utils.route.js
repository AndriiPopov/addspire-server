const express = require('express')
const { utilsController } = require('../../controllers')

const router = express.Router()

router.route('/coins-tomorrow').get(utilsController.coinsTomorrow)

module.exports = router
