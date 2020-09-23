const express = require('express')
const path = require('path')
const goals = require('../routes/goals')
const progresses = require('../routes/progresses')
const activateAccount = require('../routes/activateAccount')
const account = require('../routes/account')
const awsSignS3 = require('../routes/awsSignS3')

const friends = require('../routes/friends')
const explore = require('../routes/explore')
const profile = require('../routes/profile')
const shop = require('../routes/shop')
const wishlist = require('../routes/wishlist')
const auth = require('../routes/auth')
const authApp = require('../routes/authApp')
const user = require('../routes/user')
const blog = require('../routes/blog')
const error = require('../middleware/error')
const authtest = require('../routes/authtest')

const sslRedirect = require('heroku-ssl-redirect')

module.exports = function(app) {
    app.all('*', (req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('X-Frame-Options', 'deny')
        res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, DELETE')
        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested With, Content-Type, Accept, x-auth-token'
        )
        next()
    })

    app.use(sslRedirect())

    app.use(express.json())

    app.use(express.static(path.join(__dirname, '/../../client')))

    app.use('/api/goals', goals)
    app.use('/api/inspirations', progresses)
    app.use('/api/activate-account', activateAccount)
    app.use('/api/account', account)
    app.use('/api/friends', friends)
    app.use('/api/profile', profile)
    app.use('/api/shop', shop)
    app.use('/api/wishlist', wishlist)
    app.use('/api/explore', explore)

    app.use('/api/appauth', authApp)
    app.use('/api/auth', auth)
    app.use('/api/user', user)
    app.use('/api/sign-s3', awsSignS3)
    app.use('/api/blog', blog)

    app.use('/api/authtest', authtest)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname + '/../../client/index.html'))
    })
    app.use(error)
}
