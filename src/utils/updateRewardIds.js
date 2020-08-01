module.exports = goal => {
    for (let group of goal.rewardsGroups) {
        for (let reward of group.rewards) {
            if (!reward.rewardId) {
                group.currentId++
                reward.rewardId = group.currentId
            }
        }
    }
}
