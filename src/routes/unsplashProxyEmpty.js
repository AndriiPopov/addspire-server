const axios = require('axios')
const dayjs = require('dayjs')
const express = require('express')

const router = express.Router()

let cachedRes = null
let lastRefresh = -1

router.get('/', (req, res, next) => {
    if (!cachedRes || lastRefresh < dayjs().date()) {
        axios
            .get(
                'https://api.unsplash.com/search/photos?query=success&per_page=50',
                {
                    headers: {
                        Authorization:
                            'Client-ID xv7tFGyLSDUqXv4S30YpAXKDgpooD9OySdaKsqeJoWc',
                    },
                }
            )
            .then(response => {
                lastRefresh = dayjs().date()
                cachedRes = response.data
                res.status(200).send(response.data)
            })
            .catch(err => {})
    } else {
        res.send(cachedRes)
    }
})

module.exports = router
