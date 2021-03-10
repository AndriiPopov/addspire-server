const express = require('express')
const path = require('path')
const resources = require('../routes/resources')

// const activateAccount = require('../routes/activateAccount')
// const account = require('../routes/account')
const awsSignS3 = require('../routes/awsSignS3')

const unsplashProxy = require('../routes/unsplashProxy')
const unsplashProxyEmpty = require('../routes/unsplashProxyEmpty')
// const friends = require('../routes/friends')
// const similar = require('../routes/similar')
const explore = require('../routes/explore')
// const profile = require('../routes/profile')
const auth = require('../routes/auth')
// const authApp = require('../routes/authApp')
const user = require('../routes/user')
const blog = require('../routes/blog')
// const sitemap = require('../routes/sitemap')
const error = require('../middleware/error')
const notificationToken = require('../routes/notification')
const authtest = require('../routes/authtest')
// const serveCustomIndexProfile = require('../routes/serveCustomIndexProfile')
// const serveCustomIndexGoal = require('../routes/serveCustomIndexGoal')
// const serveCustomIndexReward = require('../routes/serveCustomIndexReward')
// const serveCustomIndexActivity = require('../routes/serveCustomIndexActivity')

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

    app.use(express.json())

    app.use(express.static(path.join(__dirname, '/../../client')))

    // app.use('/api/goals', progresses)
    app.use('/api/resources', resources)
    // app.use('/api/activate-account', activateAccount)
    // app.use('/api/account', account)
    // app.use('/api/friends', friends)
    // app.use('/api/profile', profile)
    app.use('/api/explore', explore)
    // app.use('/api/similar', similar)

    app.use('/api/auth', auth)
    // app.use('/api/appauth', authApp)
    app.use('/api/user', user)
    app.use('/api/sign-s3', awsSignS3)
    app.use('/api/blog', blog)
    // app.use('/api/notification-token', notificationToken)
    // app.use('/profile', serveCustomIndexProfile)
    // app.use('/goals', serveCustomIndexGoal)
    // app.use('/sitemap.xml', sitemap)

    app.use('/api/unsplash-proxy-empty', unsplashProxyEmpty)
    app.use('/api/unsplash-proxy', unsplashProxy)

    app.use('/api/authtest', authtest)
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname + '/../../client/index.html'))
    })
    app.use(error)
}
