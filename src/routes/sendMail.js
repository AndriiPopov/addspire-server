const express = require('express')
const router = express.Router()
var mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_API_KEY || '1',
    domain: process.env.MAILGUN_DOMAIN || '1',
})

router.post('/', (req, res, next) => {
    mailgun.messages().send(
        {
            from: 'no-reply@websiter.dev',
            to: req.body.to,
            replyTo: 'no-reply@websiter.dev',
            subject: 'New message from a contact form on Websiter.dev.',
            html: req.body.html,
        },
        function(err, reply) {
            if (err) {
                res.send({ success: false })
            } else {
                res.send({ success: true })
            }
        }
    )
})

// var fs = require('fs')
// var path = require('path')
// var pemFile = path.resolve(__dirname, 'ssl/dkim-private.pem')

// var sendmail = require('sendmail')({
//     silent: true,
//     dkim: {
//         privateKey: fs.readFileSync(pemFile, 'utf8'),
//         keySelector: 'dkim',
//     },
// })

// router.post('/', (req, res, next) => {
//     sendmail(
//         {
//             from: 'no-reply@websiter.dev',
//             to: req.body.to,
//             replyTo: 'no-reply@websiter.dev',
//             subject: 'New message from a contact form on Websiter.dev.',
//             html: req.body.html,
//         },
//         function(err, reply) {
//             if (err) {
//                 res.send({ success: false })
//             } else {
//                 res.send({ success: true })
//             }
//         }
//     )
// })
module.exports = router
