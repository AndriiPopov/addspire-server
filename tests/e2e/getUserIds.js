const { Account } = require('../../src/models')

module.exports = async (data) => {
    const account0 = await Account.findOne({
        facebookProfile: '0',
    }).lean()
    data.account0_Id = account0._id.toString()
    const account1 = await Account.findOne({
        facebookProfile: '0',
    }).lean()
    data.account1_Id = account1._id.toString()
    const account2 = await Account.findOne({
        facebookProfile: '0',
    }).lean()
    data.account2_Id = account2._id.toString()
    const account3 = await Account.findOne({
        facebookProfile: '3',
    }).lean()
    data.account3_Id = account3._id.toString()
    const account4 = await Account.findOne({
        facebookProfile: '4',
    }).lean()
    data.account4_Id = account4._id.toString()
    const account5 = await Account.findOne({
        facebookProfile: '5',
    }).lean()
    data.account5_Id = account5._id.toString()
    const account6 = await Account.findOne({
        facebookProfile: '6',
    }).lean()
    data.account6_Id = account6._id.toString()
    const account7 = await Account.findOne({
        facebookProfile: '7',
    }).lean()
    data.account7_Id = account7._id.toString()
    const account8 = await Account.findOne({
        facebookProfile: '8',
    }).lean()
    data.account8_Id = account8._id.toString()
    const account9 = await Account.findOne({
        facebookProfile: '9',
    }).lean()
    data.account9_Id = account9._id.toString()
    const account10 = await Account.findOne({
        facebookProfile: '10',
    }).lean()
    data.account10_Id = account10._id.toString()
    const account11 = await Account.findOne({
        facebookProfile: '11',
    }).lean()
    data.account11_Id = account11._id.toString()
}
