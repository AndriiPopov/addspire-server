const { Club } = require('../../src/models')
const { acceptInviteTest, createInviteTest } = require('../utils/requests')

module.exports = async (testData) => {
    await acceptInviteTest('1', await createInviteTest('0', testData.club0_Id))
    await acceptInviteTest('2', await createInviteTest('1', testData.club0_Id))
    const club0 = await Club.findById(testData.club0_Id)
    expect(club0.adminsCount).toEqual(3)

    await acceptInviteTest('6', await createInviteTest('5', testData.club1_Id))
    await acceptInviteTest('7', await createInviteTest('6', testData.club1_Id))
    await acceptInviteTest('8', await createInviteTest('7', testData.club1_Id))

    const club1 = await Club.findById(testData.club1_Id)
    expect(club1.adminsCount).toEqual(4)
}
