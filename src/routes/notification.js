const express = require('express')
const auth = require('../middleware/auth')
const getAccount = require('../utils/getAccount')

const router = express.Router()

router.post('/', auth, async (req, res) => {
    try {
        // const { error } = signFileSchema.validate(req.body)
        // if (error) {
        //     return res.status(400).send('Image upload failed. Wrong data.')
        // }
        if (!req.body.token) {
            res.send({ status: 'no token' })
            return
        }
        let account = await getAccount(req, res, 'tokens __v', true)
        if (!account) return
        if (!account.tokens.includes(req.body.token)) {
            account.tokens.push(req.body.token)
            await account.save()
        }

        res.send({
            success: true,
        })
    } catch (ex) {
        console.log(ex)
        res.status(412).send('Failed')
    }
})

module.exports = router
