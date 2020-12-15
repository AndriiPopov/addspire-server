const { redisClient: client } = require('../startup/redis')

module.exports.heartbeat = async (ws, data) => {
    try {
        ws.isAlive = true
        client.set(ws.account, true, 'EX', 40)

        if (data.notNeededResources) {
            for (let type of [
                'user',
                'account',
                'progress',
                'post',
                'transactionData',
                'reward',
                'activity',
                'friendData',
                'progressData',
                'postData',
                'rewardData',
                'activityData',
            ]) {
                for (let item of data.notNeededResources[type]) {
                    delete ws.resources[type][item]
                }
            }
        }
    } catch (ex) {}
}
