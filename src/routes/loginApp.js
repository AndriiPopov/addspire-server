const Joi = require('@hapi/joi')
const express = require('express')
const axios = require('axios')

const { resSendError } = require('../utils/resError')
const { response } = require('express')
const { createUserFB } = require('../authStrategies/createUser')
const { generateAuthToken } = require('../models/account')

const router = express.Router()

const validateSchema = Joi.object({
    platform: Joi.string().required(),
    accessToken: Joi.string().required(),
})

router.post('/', async (req, res, next) => {
    try {
        const data = req.body
        // const { error } = validateSchema.validate(data)
        // if (error) {
        //     console.log(error)
        //     resSendError(res, 'bad data')
        //     return
        // }

        axios
            .get(
                `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${
                    data.accessToken
                }`
            )
            .then(response => {
                const profileData = response.data
                const picture = profileData.picture?.data?.url
                createUserFB(
                    data.accessToken,
                    null,
                    {
                        ...profileData,
                        displayName:
                            profileData.first_name +
                            ' ' +
                            profileData.last_name,
                        picture,
                        photos: [{ value: picture }],
                    },
                    (_empty, account) => {
                        const token = generateAuthToken(account, true)
                        res.send({
                            success: true,
                            token,
                        })
                    }
                )
            })
            .catch(err => {
                resSendError(res, 'bad data')
                return
            })
    } catch (ex) {
        console.log(ex)
    }
})

module.exports = router
