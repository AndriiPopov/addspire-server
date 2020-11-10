const { Progress } = require('../models/progress')
const express = require('express')
const path = require('path')
const fs = require('fs')
const { Reward } = require('../models/reward')
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

router.get('/:id', async (req, res, next) => {
    try {
        if (indexData) {
            const reward = await Reward.findById(req.params.id)
                .lean()
                .exec()

            const wish = reward.wish
            if (reward)
                res.send(
                    indexData.replace(
                        '<head>',
                        `
                <meta property="og:url" content="https://addspire.com/${
                    wish ? 'wishlist' : 'rewards'
                }/${reward._id}" />
                <meta property="og:title" content="${reward.name} ${
                            wish ? 'wishlist item' : 'reward'
                        } on Addspire.com - a social network for sharing and supporting ideas, promises and resolutions." />
                <meta property="og:description" content="${reward.descriptionText ||
                    ''}" />
                <meta property="og:image" content="${(reward.images &&
                    reward.images.length > 0 &&
                    reward.images[0]) ||
                    'https://addspire.com/logo.jpg'}" />
                <meta property="og:type" content="website" />
                
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:title" content="${reward.name}">
                <meta name="twitter:description" content="${reward.descriptionText ||
                    ''}">
                <meta name="twitter:image:src" content="${(reward.images &&
                    reward.images.length > 0 &&
                    reward.images[0]) ||
                    'https://addspire.com/logo.jpg'}">
                <meta name="twitter:url" content="https://addspire.com/${
                    wish ? 'wishlist' : 'rewards'
                }/${reward._id}">
                <meta name="twitter:domain" content="addspire.com">
                <meta name="twitter:site" content="@">
                <meta name="twitter:creator" content="@...">
                `
                    )
                )
        } else {
            getIndexData()
        }
    } catch (ex) {}
})

module.exports = router
