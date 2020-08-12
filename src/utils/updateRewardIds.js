module.exports = goal => {
    for (let group of goal.rewardsGroups) {
        for (let reward of group.rewards) {
            if (!reward.rewardId) {
                if (group.currentId) group.currentId++
                else group.currentId = 1
                reward.rewardId = group.currentId
            }
        }
    }
}
