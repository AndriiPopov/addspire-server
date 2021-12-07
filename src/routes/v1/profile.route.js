const express = require('express')
const { profileController } = require('../../controllers')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { profileValidation } = require('../../validations')

const router = express.Router()

router
    .route('/create')
    .post(
        validate(profileValidation.createProfile),
        auth(),
        profileController.createProfile
    )

router
    .route('/edit')
    .post(
        validate(profileValidation.editProfile),
        auth(),
        profileController.editProfile
    )

router
    .route('/delete')
    .post(
        validate(profileValidation.deleteProfile),
        auth(),
        profileController.deleteProfile
    )

router
    .route('/choose-default-profile')
    .post(
        validate(profileValidation.chooseDefaultProfile),
        auth(),
        profileController.chooseDefaultProfile
    )

module.exports = router
