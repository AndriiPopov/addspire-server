const { promisify } = require('util')

const client = require('redis').createClient(process.env.REDIS_URL || undefined)
const get = promisify(client.get).bind(client)
const mget = promisify(client.mget).bind(client)

module.exports.redisClient = client
module.exports.scanAll = async () => {
    const scan = promisify(client.scan).bind(client)
    const found = []
    let cursor = '0'

    do {
        const reply = await scan(cursor)

        cursor = reply[0]
        found.push(...reply[1])
    } while (cursor !== '0')

    return new Set(found)
}
module.exports.get = get
module.exports.mget = mget
