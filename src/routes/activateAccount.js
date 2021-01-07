const auth = require('../middleware/auth')

const { User } = require('../models/user')
const { Account } = require('../models/account')
const express = require('express')
const Joi = require('@hapi/joi')
const { resSendError } = require('../utils/resError')
const { JoiLength } = require('../constants/fieldLength')
Joi.objectId = require('joi-objectid')(Joi)
const router = express.Router()

const activateAccountSchema = Joi.object({
    nickname: Joi.string()
        .min(2)
        .max(JoiLength.name)
        .regex(new RegExp(/^[a-zA-Z0-9_-]*$/))
        .required(),
    name: Joi.string()
        .min(2)
        .max(JoiLength.name - 1)
        .required(),
})

router.post('/', auth, async (req, res, next) => {
    try {
        const data = req.body
        const { error } = activateAccountSchema.validate(data)
        if (error) {
            console.log(error)
            resSendError(res, 'bad data')
            return
        }

        const _id = data.nickname.toLowerCase()
        const nicknameNotUnique = await Account.count({ _id })
        if (nicknameNotUnique > 0) {
            res.send({
                nicknameNotUnique: true,
            })
            return
        }
        let account = new Account({
            _id,
            name: data.name,
            status: 'activated',
            structure: {
                currentId: 9,
                items: {
                    b0: {
                        type: 'profile',
                        children: ['b00', 'b1', 'b2', 'b3'],
                        parent: '',
                        sizePos: { x: 0, y: 0 },
                        currentId: 0,
                    },
                    b00: {
                        type: 'folder',
                        unsorted: true,
                        children: [],
                        innerChildren: ['b9', 'b10'],
                        parent: 'b0',
                        sizePos: {
                            x: -600,
                            y: -300,
                            width: 200,
                            height: 200,
                        },
                    },
                    b6: {
                        type: 'text',
                        value: 'Activities',
                    },
                    b7: {
                        type: 'text',
                        value: 'Goals',
                    },
                    b1: {
                        type: 'folder',
                        children: [],
                        innerChildren: ['b4'],
                        parent: 'b0',
                        sizePos: {
                            x: 300,
                            y: 0,
                            width: 200,
                            height: 200,
                        },
                    },
                    b2: {
                        type: 'folder',
                        children: [],
                        innerChildren: ['b6'],
                        parent: 'b0',
                        sizePos: {
                            x: -300,
                            y: 0,
                            width: 200,
                            height: 200,
                        },
                    },
                    b3: {
                        type: 'folder',
                        children: [],
                        innerChildren: ['b7'],
                        parent: 'b0',
                        sizePos: {
                            x: 0,
                            y: 500,
                            width: 200,
                            height: 200,
                        },
                    },
                    b4: {
                        type: 'text',
                        value: 'Rewards',
                    },

                    b9: {
                        type: 'text',
                        value: 'Unsorted',
                    },
                    b10: {
                        type: 'image',
                        value: '',
                        sizePos: {
                            x: 50,
                            y: 100,
                            width: 100,
                            height: 100,
                        },
                    },
                },
            },
        })

        await account.save()

        req.user.myAccount = account._id
        req.user.currentAccount = account._id
        req.user.save()

        res.send({
            success: true,
        })
    } catch (ex) {
        console.log(ex)
    }
})

module.exports = router
