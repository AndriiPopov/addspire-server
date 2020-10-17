module.exports = goal => {
    if (goal.rewards)
        for (let reward of goal.rewards) {
            if (!reward.rewardId) {
                if (goal.currentId) goal.currentId++
                else goal.currentId = 1
                reward.rewardId = goal.currentId
            }
        }
}
