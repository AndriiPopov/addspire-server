const setupTestDB = require('../utils/setupTestDB')
const { Account, Reputation, Count, System } = require('../../src/models')
const { viewsRewardService } = require('../../src/services')
const getDistributeCoinsToday = require('../../src/utils/getDistributeCoinsToday')

setupTestDB()

describe('Reward coins for views', () => {
    test('distribute coins among counts and amoung contributors', async () => {
        const system = await System.System.findOne({ name: 'system' })
            .select('lastReplenishDate date')
            .lean()
            .exec()
        const oldUser0 = await Account.findOne({
            facebookProfile: '0',
        }).lean()
        const userId0 = oldUser0._id.toString()
        const oldUser1 = await Account.findOne({
            facebookProfile: '1',
        }).lean()
        const userId1 = oldUser1._id.toString()
        const oldUser2 = await Account.findOne({
            facebookProfile: '2',
        }).lean()
        const userId2 = oldUser2._id.toString()
        const oldUser3 = await Account.findOne({
            facebookProfile: '3',
        }).lean()
        const userId3 = oldUser3._id.toString()
        const oldUser4 = await Account.findOne({
            facebookProfile: '4',
        }).lean()
        const userId4 = oldUser4._id.toString()
        const oldUser5 = await Account.findOne({
            facebookProfile: '5',
        }).lean()
        const userId5 = oldUser5._id.toString()

        const count0 = new Count({
            total: 100,
            day: 10,
            question: 'lalal',
            questionName: 'lololo',
            reputationDestribution: {
                [userId0]: 10,
                [userId1]: 20,
                [userId2]: -30,
                [userId3]: 40,
            },
        })
        const count1 = new Count({
            total: 100,
            day: 100,
            question: 'lalal1',
            questionName: 'lololo2',
            reputationDestribution: {
                [userId2]: 50,
                [userId3]: 40,
                [userId4]: 10,
                [userId5]: 20,
            },
        })
        await count0.save()
        await count1.save()
        const countId0 = count0._id.toString()
        const countId1 = count1._id.toString()

        await viewsRewardService.viewsReward()

        const user0 = await Account.findById(userId0).lean()
        const user1 = await Account.findById(userId1).lean()
        const user2 = await Account.findById(userId2).lean()
        const user3 = await Account.findById(userId3).lean()
        const user4 = await Account.findById(userId4).lean()
        const user5 = await Account.findById(userId5).lean()

        const distributeToday = getDistributeCoinsToday(system.date)

        const price = distributeToday / 110

        const priceCount0 = (price * 10) / 70
        const priceCount1 = (price * 100) / 120

        expect(user0.wallet).toEqual(oldUser0.wallet + priceCount0 * 10)
        expect(user1.wallet).toEqual(oldUser1.wallet + priceCount0 * 20)
        expect(user2.wallet).toEqual(oldUser2.wallet + priceCount1 * 50)
        expect(user3.wallet).toEqual(
            oldUser3.wallet + priceCount0 * 40 + priceCount1 * 40
        )
        expect(user4.wallet).toEqual(oldUser4.wallet + priceCount1 * 10)
        expect(user5.wallet).toEqual(oldUser5.wallet + priceCount1 * 20)

        const newCountId0 = await Count.findById(countId0).lean()
        const newCountId1 = await Count.findById(countId1).lean()

        expect(newCountId0.day).toEqual(0)
        expect(newCountId1.day).toEqual(0)
    })
})
