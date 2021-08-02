const setupTestDB = require('../utils/setupTestDB')
const { Account, Reputation } = require('../../src/models')
const { replenishService } = require('../../src/services')

setupTestDB()

describe('Replenish reputation', () => {
    test('should save reputation history and account history, add upto 5 to reputation if it is less than zero', async () => {
        const oldUser0 = await Account.findOne({
            facebookProfile: 'f_0',
        }).lean()
        const userId0 = oldUser0._id.toString()
        const oldReputationObj0 = await Reputation.findOne({
            owner: userId0,
        }).lean()
        const reputationId0 = oldReputationObj0._id.toString()

        const oldUser1 = await Account.findOne({
            facebookProfile: 'f_1',
        }).lean()
        const userId1 = oldUser1._id.toString()
        const oldReputationObj1 = await Reputation.findOne({
            owner: userId1,
        }).lean()
        const reputationId1 = oldReputationObj1._id.toString()

        const oldUser2 = await Account.findOne({
            facebookProfile: 'f_2',
        }).lean()
        const userId2 = oldUser2._id.toString()
        const oldReputationObj2 = await Reputation.findOne({
            owner: userId2,
        }).lean()
        const reputationId2 = oldReputationObj2._id.toString()

        await Account.updateOne(
            { _id: userId0 },
            { $set: { wallet: 0, walletHistory: [{ coins: 5 }] } },
            { useFindAndModify: false }
        )

        await Account.updateOne(
            { _id: userId1 },
            { $set: { wallet: 10 } },
            { useFindAndModify: false }
        )

        await Account.updateOne(
            { _id: userId2 },
            {
                $set: {
                    wallet: 100,
                    walletHistory: [{ coins: 5 }, { coins: 10 }],
                },
            },
            { useFindAndModify: false }
        )

        await Reputation.updateOne(
            { _id: reputationId0 },
            {
                $set: {
                    reputation: -10,
                    reputationHistory: [{ reputation: 5 }],
                },
            },
            { useFindAndModify: false }
        )

        await Reputation.updateOne(
            { _id: reputationId1 },
            {
                $set: {
                    reputation: -3,
                },
            },
            { useFindAndModify: false }
        )

        await Reputation.updateOne(
            { _id: reputationId2 },
            {
                $set: {
                    reputation: 1,
                    reputationHistory: [{ reputation: 0 }, { reputation: -10 }],
                },
            },
            { useFindAndModify: false }
        )

        await replenishService.replenish()

        const user0 = await Account.findById(userId0).lean()
        const reputationObj0 = await Reputation.findById(reputationId0).lean()
        const user1 = await Account.findById(userId1).lean()
        const reputationObj1 = await Reputation.findById(reputationId1).lean()
        const user2 = await Account.findById(userId2).lean()
        const reputationObj2 = await Reputation.findById(reputationId2).lean()

        expect(user0.wallet).toEqual(0)
        expect(user0.walletHistory.length).toEqual(2)
        expect(user0.walletHistory[0]).toMatchObject({ coins: 5 })
        expect(user0.walletHistory[1]).toMatchObject({ coins: 0 })

        expect(user1.wallet).toEqual(10)
        expect(user1.walletHistory.length).toEqual(1)
        expect(user1.walletHistory[0]).toMatchObject({ coins: 10 })

        expect(user2.wallet).toEqual(100)
        expect(user2.walletHistory.length).toEqual(3)
        expect(user2.walletHistory[0]).toMatchObject({ coins: 5 })
        expect(user2.walletHistory[1]).toMatchObject({ coins: 10 })
        expect(user2.walletHistory[2]).toMatchObject({ coins: 100 })

        expect(reputationObj0.reputation).toEqual(-5)
        expect(reputationObj0.reputationHistory.length).toEqual(2)
        expect(reputationObj0.reputationHistory[0]).toMatchObject({
            reputation: 5,
        })
        expect(reputationObj0.reputationHistory[1]).toMatchObject({
            reputation: -10,
        })

        expect(reputationObj1.reputation).toEqual(0)
        expect(reputationObj1.reputationHistory.length).toEqual(1)
        expect(reputationObj1.reputationHistory[0]).toMatchObject({
            reputation: -3,
        })

        expect(reputationObj2.reputation).toEqual(1)
        expect(reputationObj2.reputationHistory.length).toEqual(3)
        expect(reputationObj2.reputationHistory[0]).toMatchObject({
            reputation: 0,
        })
        expect(reputationObj2.reputationHistory[1]).toMatchObject({
            reputation: -10,
        })
        expect(reputationObj2.reputationHistory[2]).toMatchObject({
            reputation: 1,
        })
    })
})
