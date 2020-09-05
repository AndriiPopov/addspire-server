const axios = require('axios')
const express = require('express')

const router = express.Router()
axios.defaults.baseURL = 'http://api.websiter.dev'

router.post('/', async (req, res) => {
    try {
        axios
            .post('https://api.websiter.dev/api/html', {
                url: req.body.url,
            })
            .then(response => {
                console.log(response.data)
                res.status(200).send({
                    body: response.data.bodyComp,
                    title: response.data.title,
                })
            })
            .catch(err => {})
    } catch (ex) {}
})

module.exports = router
