const { redisClient: client } = require('../startup/redis')
const resources = require('../constants/resources')

module.exports.heartbeat = async (ws, data) => {
    try {
        ws.isAlive = true
        client.set(ws.account, true, 'EX', 40)

        if (data.notNeededResources) {
            for (let type of resources) {
                for (let item of data.notNeededResources[type]) {
                    delete ws.resources[type][item]
                }
            }
        }
    } catch (ex) {}
}
