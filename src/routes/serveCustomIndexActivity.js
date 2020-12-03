const { Progress } = require('../models/progress')
const express = require('express')
const path = require('path')
const fs = require('fs')
const { Activity } = require('../models/activity')
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
            const activity = await Activity.findById(req.params.id)
                .lean()
                .exec()

            if (activity)
                res.send(
                    indexData.replace(
                        '<head>',
                        `
                <meta property="og:url" content="https://addspire.com/activities/${
                    activity._id
                }" />
                <meta property="og:title" content="${
                    activity.name
                } activity on Addspire.com - a social network for sharing and supporting ideas, promises and resolutions." />
                <meta property="og:description" content="${activity.descriptionText ||
                    ''}" />
                <meta property="og:image" content="${(activity.images &&
                    activity.images.length > 0 &&
                    activity.images[0]) ||
                    'https://addspire.com/logo.jpg'}" />
                <meta property="og:type" content="website" />
                
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:title" content="${activity.name}">
                <meta name="twitter:description" content="${activity.descriptionText ||
                    ''}">
                <meta name="twitter:image:src" content="${(activity.images &&
                    activity.images.length > 0 &&
                    activity.images[0]) ||
                    'https://addspire.com/logo.jpg'}">
                <meta name="twitter:url" content="https://addspire.com/${
                    wish ? 'wishlist' : 'rewards'
                }/${activity._id}">
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
