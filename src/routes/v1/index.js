const express = require('express')
const authRoute = require('./auth.route')
const userRoute = require('./user.route')
const documentRoute = require('./document.route')
const mediaRoute = require('./media.route')
const docsRoute = require('./docs.route')
const clubRoute = require('./club.route')
const config = require('../../config/config')

const router = express.Router()

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute,
    },
    {
        path: '/users',
        route: userRoute,
    },
    {
        path: '/document',
        route: documentRoute,
    },
    {
        path: '/media',
        route: mediaRoute,
    },
    {
        path: '/club',
        route: clubRoute,
    },
]

const devRoutes = [
    // routes available only in development mode
    {
        path: '/docs',
        route: docsRoute,
    },
]

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

/* istanbul ignore next */
if (config.env === 'development') {
    devRoutes.forEach((route) => {
        router.use(route.path, route.route)
    })
}

module.exports = router
