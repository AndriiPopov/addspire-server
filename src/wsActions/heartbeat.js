module.exports.heartbeat = async (ws, data) => {
    try {
        ws.isAlive = true
        if (data.notNeededResources) {
            for (let type of [
                'user',
                'account',
                'progress',
                'post',
                'transactionData',
                'reward',
                'friendData',
                'progressData',
                'postData',
                'rewardData',
            ]) {
                for (let item of data.notNeededResources[type]) {
                    delete ws.resources[type][item]
                }
            }
        }
    } catch (ex) {}
}
