const httpStatus = require('http-status')

const ApiError = require('../utils/ApiError')
const getResourcesFromList = require('../utils/getResourcesFromList')
const resources = require('../config/resources')
const getModelFromType = require('../utils/getModelFromType')
const { get, client } = require('./redis.service')
const { System } = require('../models')
const getDistributeCoinsToday = require('../utils/getDistributeCoinsToday')
const grades = require('../config/grades')
const fieldLength = require('../config/fieldLength')
const value = require('../config/value')

const poll = {}
const responseIds = {}
let currentId = 0

const getResource = async (req) => {
    try {
        const data = req.body
        const [result] = await getResourcesFromList(data, req)

        if (result && result.length > 0) {
            return {
                messageCode: 'addResource',
                type: data.type,
                resources: result.filter((item) => item),
            }
        }
        return {
            messageCode: 'notFoundResource',
            _id: data.ids,
        }
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const pollResource = async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders() // flush the headers to establish SSE with client

        const { pollResources } = req.body
        // Give each response an id and add it to object of reponses with ids it is polling
        currentId += 1
        const resId = `r_${currentId}`
        responseIds[resId] = { res, ids: [] }

        // On close delete response from responseIds and remove the response id from object of subscribed resources
        req.on('close', () => {
            if (responseIds[resId]) {
                responseIds[resId].ids.forEach((id) => {
                    poll[id] = poll[id].filter((item) => item !== resId)
                })
                delete responseIds[resId]
            }
        })

        // Subscribe responseId to resourceId by adding it to a list.
        // Compare the version of the resources to the version in redis.
        resources.forEach((key) => {
            if (pollResources.resources[key] && responseIds[resId]) {
                // If the key has D at the end, remove it.
                let shortKey = ` ${key}`.slice(1)
                if (shortKey.indexOf('D') === shortKey.length - 1)
                    shortKey = shortKey.substring(0, shortKey.length - 1)
                Object.keys(pollResources.resources[key]).forEach(
                    async (id) => {
                        if (
                            pollResources.resources[key][id] &&
                            responseIds[resId]
                        ) {
                            // Compare the version
                            const clientV = pollResources.resources[key][id]
                            let version = await get(`${shortKey}_${id}`)

                            // If version not exist in redis, get it
                            if (!version) {
                                const model = getModelFromType(key)
                                const resource = await model
                                    .findById(id)
                                    .select('__v')
                                    .lean()
                                    .exec()
                                if (resource) {
                                    version = resource.__v
                                    client.set(
                                        `${shortKey}_${id}`,
                                        version,
                                        'EX',
                                        600
                                    )
                                } else {
                                    res.write(
                                        `data: ${JSON.stringify({
                                            messageCode: 'notFoundResource',
                                            _id: [id],
                                        })}\n\n`
                                    )
                                    res.flush()
                                }
                            }

                            if (version) {
                                const docId = `${shortKey}_${id}`
                                // If version is actual, add the responseId to poll object.
                                // Create property for the resourceId if not exist in poll object.
                                if (version.toString() === clientV.toString()) {
                                    poll[docId] = poll[docId]
                                        ? [...poll[docId], resId]
                                        : [resId]
                                    if (
                                        responseIds[resId] &&
                                        responseIds[resId].ids
                                    )
                                        responseIds[resId].ids.push(docId)
                                } else {
                                    // If some versions are not actual, response with actual resources.
                                    const [result] = await getResourcesFromList(
                                        {
                                            type: key,
                                            ids: [id],
                                        }
                                    )
                                    res.write(
                                        `data: ${JSON.stringify({
                                            messageCode: 'addResource',
                                            type: key,
                                            resources: result.filter(
                                                (item) => item
                                            ),
                                        })}\n\n`
                                    )
                                    res.flush()
                                }
                            }
                        }
                    }
                )
            }
        })

        // Handle locales

        if (pollResources.locales) {
            pollResources.locales.forEach(async (languageArray) => {
                if (languageArray.length === 2) {
                    const [languageName, languageVersion] = languageArray

                    const version = await get(`${languageName}_frontend_v`)
                    if (
                        version &&
                        version.toString() !== languageVersion.toString()
                    ) {
                        const locale = await get(`${languageName}_frontend_l`)
                        if (locale) {
                            res.write(
                                `data: ${JSON.stringify({
                                    messageCode: 'updateLocale',
                                    value: [
                                        languageName,
                                        version,
                                        JSON.parse(locale),
                                    ],
                                })}\n\n`
                            )
                            res.flush()
                        }
                    } else if (!version) {
                        res.write(
                            `data: ${JSON.stringify({
                                messageCode: 'noLocale',
                                value: languageName,
                            })}\n\n`
                        )
                        res.flush()
                    }
                }
            })
        }
        // Handle refresh constants
        if (pollResources.refreshConstants) {
            const refrehedData = {
                grades,
                constValues: value,
                fieldLength: fieldLength.JoiLength,
            }

            let coins = await get('coinsTomorrow')
            if (!coins) {
                const system = await System.System.findOne({ name: 'system' })
                    .select('date')
                    .lean()
                    .exec()
                coins = getDistributeCoinsToday(system.date, true)
                if (coins) client.set('coinsTomorrow', coins)
            } else coins = parseFloat(coins)
            if (coins) refrehedData.coinsTomorrow = coins

            const availableLocales = await get('availableLocales_frontend')
            if (availableLocales)
                refrehedData.availableLocales = JSON.parse(availableLocales)

            res.write(
                `data: ${JSON.stringify({
                    messageCode: 'refreshConstants',
                    value: refrehedData,
                })}\n\n`
            )
            res.flush()
        }

        setTimeout(() => {
            req.pause()
            res.status = 400
            res.end('restart poll')
        }, 30 * 60 * 1000)
    } catch (error) {
        if (!error.isOperational) {
            throw new ApiError(httpStatus.CONFLICT, 'Not created')
        } else throw error
    }
}

const sendUpdatedData = (data, keys) => {
    if (keys.length < 1) return

    if (data.updateDescription.updatedFields.__v)
        client.set(
            `${keys[0]}_${data.documentKey._id}`,
            data.updateDescription.updatedFields.__v.toString(),
            'EX',
            600
        )
    keys.forEach((key) => {
        let ids = poll[`${key}_${data.documentKey._id.toString()}`]
        if (ids && ids.length > 0) {
            ids = [...new Set(ids)]
            poll[`${key}_${data.documentKey._id.toString()}`] = []
            ids.forEach((id) => {
                const res = responseIds[id]

                if (res) {
                    res.res.write(
                        `data: ${JSON.stringify({
                            messageCode: 'updateResource',
                            code: key,
                            id: data.documentKey._id.toString(),
                            update: data.updateDescription,
                        })}\n\n`
                    )
                    res.res.flush()

                    // delete responseIds[id]
                }
            })
        }
    })
}

setInterval(async () => {
    Object.keys(responseIds).forEach((resId) => {
        const res = responseIds[resId]
        if (res && res.res) {
            res.res.write(
                `data: ${JSON.stringify({
                    messageCode: 'ping',
                })}\n\n`
            )
            res.res.flush()
        }
    })
}, 15000)

module.exports = {
    getResource,
    pollResource,
    sendUpdatedData,
}
