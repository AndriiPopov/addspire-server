const express = require('express')
const { clubController } = require('../../controllers')
const auth = require('../../middlewares/auth')
const validate = require('../../middlewares/validate')
const { clubValidation } = require('../../validations')

const router = express.Router()

router
    .route('/create')
    .post(
        validate(clubValidation.createClub),
        auth(),
        clubController.createClub
    )

router
    .route('/edit')
    .post(validate(clubValidation.editClub), auth(), clubController.editClub)

router
    .route('/invite')
    .post(validate(clubValidation.invite), auth(), clubController.invite)

router
    .route('/accept-invite')
    .post(
        validate(clubValidation.acceptInvite),
        auth(),
        clubController.acceptInvite
    )

router
    .route('/add-resident')
    .post(
        validate(clubValidation.addResident),
        auth(),
        clubController.addResident
    )

router
    .route('/leave-residence')
    .post(
        validate(clubValidation.leaveResidence),
        auth(),
        clubController.leaveResidence
    )

router
    .route('/request-residence')
    .post(
        validate(clubValidation.requestResidence),
        auth(),
        clubController.requestResidence
    )

router
    .route('/accept-residence-request')
    .post(
        validate(clubValidation.acceptResidenceRequest),
        auth(),
        clubController.acceptResidenceRequest
    )

router
    .route('/decline-residence-request')
    .post(
        validate(clubValidation.declineResidenceRequest),
        auth(),
        clubController.declineResidenceRequest
    )

router
    .route('/edit-start-rule')
    .post(
        validate(clubValidation.editStartRule),
        auth(),
        clubController.editStartRule
    )

router
    .route('/ban')
    .post(validate(clubValidation.ban), auth(), clubController.ban)

router
    .route('/edit-reputation')
    .post(
        validate(clubValidation.editReputation),
        auth(),
        clubController.editReputation
    )

router
    .route('/get-reputation-id')
    .post(
        validate(clubValidation.getReputationId),
        auth(),
        clubController.getReputationId
    )

module.exports = router
