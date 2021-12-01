const { promisify } = require('util')

const client = require('redis').createClient(6379)

const get = promisify(client.get).bind(client)
const mget = promisify(client.mget).bind(client)

const scanAll = async () => {
    const scan = promisify(client.scan).bind(client)
    const found = []
    let cursor = '0'

    do {
        // eslint-disable-next-line no-await-in-loop
        const reply = await scan(cursor)

        // eslint-disable-next-line prefer-destructuring
        cursor = reply[0]
        found.push(...reply[1])
    } while (cursor !== '0')

    return new Set(found)
}

const closeInstance = (callback) => {
    client.quit(callback)
}

module.exports = {
    get,
    mget,
    scanAll,
    client,
    closeInstance,
}
