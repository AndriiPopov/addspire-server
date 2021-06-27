const express = require('express')
const authRoute = require('./auth.route')
const accountRoute = require('./account.route')
const documentRoute = require('./document.route')
const mediaRoute = require('./media.route')
const clubRoute = require('./club.route')
const resourceRoute = require('./resource.route')
const utilsRoute = require('./utils.route')
const tagRoute = require('./tag.route')
const commentRoute = require('./comment.route')
const searchRoute = require('./search.route')

const router = express.Router()

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoute,
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
    {
        path: '/tag',
        route: tagRoute,
    },
    {
        path: '/account',
        route: accountRoute,
    },
    {
        path: '/resource',
        route: resourceRoute,
    },
    {
        path: '/utils',
        route: utilsRoute,
    },
    {
        path: '/comment',
        route: commentRoute,
    },
    {
        path: '/search',
        route: searchRoute,
    },
]

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route)
})

module.exports = router
