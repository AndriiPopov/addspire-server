const express = require('express')
const getResourcesFromList = require('../utils/getResourcesFromList')

const router = express.Router()

router.post('/', async (req, res, next) => {
    try {
        const data = req.body

        if (data.type && data.ids && data.ids.length > 0) {
            const [result, fields, onlineUsers] = await getResourcesFromList(
                data
            )

            if (result && result.length > 0) {
                res.send({
                    messageCode: 'addResource',
                    type: data.type,
                    resources: result.filter(item => item),
                    newOnlineUsers: onlineUsers,
                })
                return
            } else {
                if (!fields) {
                    res.send({
                        messageCode: '404',
                    })
                    return
                } else {
                    res.send({
                        messageCode: 'notFoundResource',
                        _id: data.ids,
                    })
                    return
                }
            }
        }
        res.send({
            messageCode: 'noResources',
        })
        return
    } catch (ex) {
        console.log(ex)
        res.send({
            success: false,
        })
    }
})

module.exports = router
