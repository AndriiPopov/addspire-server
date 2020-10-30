const { Progress } = require('../models/progress')
const express = require('express')
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

router.get('/:id', async (req, res, next) => {
    try {
        if (indexData) {
            const progress = await Progress.findById(req.params.id)
                .select('goal.name goal.images goal.descriptionText')
                .lean()
                .exec()
            console.log(progress)
            if (progress)
                res.send(
                    indexData.replace(
                        '<head>',
                        `
                <meta property="og:url" content="https://addspire.com/goals/${
                    progress._id
                }" />
                <meta property="og:title" content="${
                    progress.goal.name
                } goal on Addspire.com - a social network for sharing and supporting ideas, promises and resolutions." />
                <meta property="og:description" content="${progress.goal
                    .descriptionText || ''}" />
                <meta property="og:image" content="${(progress.goal.images &&
                    progress.goal.images.length > 0 &&
                    progress.goal.images[0]) ||
                    'https://addspire.com/logo.jpg'}" />
                <meta property="ogd:type" content="website" />
                `
                    )
                )
        } else {
            getIndexData()
        }
    } catch (ex) {}
})

module.exports = router
