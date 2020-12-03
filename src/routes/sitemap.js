const { Account } = require('../models/account')
const express = require('express')
const { Post } = require('../models/post')
const { SitemapStream, streamToPromise } = require('sitemap')
const { createGzip } = require('zlib')
const { Readable } = require('stream')
const { Progress } = require('../models/progress')
const { Reward } = require('../models/reward')
const axios = require('axios')
const { Activity } = require('../models/activity')
const router = express.Router()

let sitemap
let clearSitemap

router.get('/', async (req, res) => {
    res.header('Content-Type', 'application/xml')
    res.header('Content-Encoding', 'gzip')
    // if we have a cached entry send it
    if (sitemap) {
        res.send(sitemap)
        return
    }

    try {
        const smStream = new SitemapStream({
            hostname: 'https://addspire.com/',
        })
        const pipeline = smStream.pipe(createGzip())

        smStream.write({ url: '/' })
        smStream.write({ url: '/blog' })
        smStream.write({ url: '/ru/blog' })
        let ids = await Account.distinct('_id')
        if (ids) for (let id of ids) smStream.write({ url: '/profile/' + id })
        ids = await Progress.distinct('_id')
        if (ids) for (let id of ids) smStream.write({ url: '/goals/' + id })
        ids = await Reward.distinct('_id')
        if (ids) for (let id of ids) smStream.write({ url: '/rewards/' + id })
        ids = await Activity.distinct('_id', { wish: true })
        if (ids)
            for (let id of ids) smStream.write({ url: '/activities/' + id })
        const articles = await axios.post(
            'https://addspire-blog.herokuapp.com/graphql',
            {
                query: `
             query {
   posts {
    url
    language
    }
}`,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        )
        if (articles)
            for (let article of articles.data.data.posts)
                if (article.language === 'en')
                    smStream.write({ url: '/blog/' + article.url })
                else if (article.language === 'ru')
                    smStream.write({ url: '/ru/blog/' + article.url })

        streamToPromise(pipeline).then(sm => {
            sitemap = sm
            clearSitemap = setTimeout(() => {
                sitemap = null
            }, 86400000)
        })

        smStream.end()
        pipeline.pipe(res).on('error', e => {
            throw e
        })
    } catch (e) {
        console.error(e)
        res.status(500).end()
    }
})

module.exports = router
