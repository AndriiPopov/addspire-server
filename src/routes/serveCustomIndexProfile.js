const { Account } = require('../models/account')

const express = require('express')
const Joi = require('@hapi/joi')
const path = require('path')
const fs = require('fs')
const router = express.Router()

let indexData
const filePath = path.join(__dirname, '/../../client/index.html')

const getIndexData = () =>
    fs.readFile(filePath, 'utf8', function(err, data) {
        if (err) {
            return console.log(err)
        }
        indexData = data
    })

getIndexData()

const getAvatar = (nickname, version) => {
    if (!nickname || !version) return ''
    else {
        return (
            'https://websiter.s3.us-east-2.amazonaws.com/' +
            nickname +
            '/avatar?v=' +
            (version || 0)
        )
    }
}

router.get('/:id', async (req, res, next) => {
    try {
        if (indexData) {
            const account = await Account.findById(req.params.id)
                .select('image name')
                .lean()
                .exec()
            if (account)
                res.send(
                    indexData.replace(
                        '<head>',
                        `
                <meta property=”og:url” content="https://addspire.com/profile/${
                    account._id
                }" />
                <meta property=”og:title” content="${
                    account.name
                } account on Addspire.com." />
                <meta property=”og:type” content=”website” />
                <meta property=”og:description” content=”Addspire.com is a social network for sharing and supporting ideas, promises and resolutions.” />
                <meta property=”og:image” content=”${getAvatar(
                    account._id,
                    account.image
                ) || 'https://addspire.com/logo.jpg'}” />
                `
                    )
                )
        } else getIndexData()
    } catch (ex) {}
})

module.exports = router
