const dayjs = require('dayjs')
const { SitemapStream, streamToPromise } = require('sitemap')
const { createGzip } = require('zlib')
const { Account, Club, Question } = require('../models')

let sitemap
let generatedDate

const sendSitemap = async (req, res) => {
    res.header('Content-Type', 'application/xml')
    res.header('Content-Encoding', 'gzip')
    // if we have a cached entry send it
    if (
        sitemap &&
        generatedDate &&
        Math.abs(dayjs().diff(generatedDate, 'hours')) < 3
    ) {
        res.send(sitemap)
        return
    }

    try {
        const smStream = new SitemapStream({
            hostname: 'https://addspire.com/',
        })

        const pipeline = smStream.pipe(createGzip())

        smStream.write({
            url: ``,
            priority: 1,
        })

        smStream.write({
            url: `/about`,
            priority: 0.9,
        })

        const urls = ['club-rules', 'reputation-rules', 'coins-rules']
        urls.forEach((item) => {
            smStream.write({
                url: `/${item}`,
                priority: 0.8,
            })
        })

        const questions = await Question.find({}).select('_id').lean().exec()
        questions.forEach((item) => {
            smStream.write({
                url: `/question/${item._id}`,
                changefreq: 'daily',
                priority: 0.7,
            })
        })

        const clubs = await Club.find({}).select('_id').lean().exec()
        clubs.forEach((item) => {
            smStream.write({
                url: `club/${item._id}`,
                changefreq: 'daily',
                priority: 0.4,
            })
        })

        const users = await Account.find({}).select('_id').lean().exec()
        users.forEach((item) => {
            smStream.write({
                url: `user/${item._id}`,
                changefreq: 'weekly',
                priority: 0.4,
            })
        })

        // cache the response
        streamToPromise(pipeline).then((sm) => {
            sitemap = sm
            generatedDate = dayjs()
        })
        // make sure to attach a write stream such as streamToPromise before ending
        smStream.end()
        // stream write the response
        pipeline.pipe(res).on('error', (e) => {
            throw e
        })
    } catch (e) {
        console.error(e)
        res.status(500).end()
    }
}

module.exports = {
    sendSitemap,
}
