const { Account } = require('../../src/models')

module.exports = async (data) => {
    const account0 = await Account.findOne({
        facebookProfile: 'f_0',
    }).lean()
    data.account0_Id = account0._id.toString()
    const account1 = await Account.findOne({
        facebookProfile: 'f_0',
    }).lean()
    data.account1_Id = account1._id.toString()
    const account2 = await Account.findOne({
        facebookProfile: 'f_0',
    }).lean()
    data.account2_Id = account2._id.toString()
    const account3 = await Account.findOne({
        facebookProfile: 'f_3',
    }).lean()
    data.account3_Id = account3._id.toString()
    const account4 = await Account.findOne({
        facebookProfile: 'f_4',
    }).lean()
    data.account4_Id = account4._id.toString()
    const account5 = await Account.findOne({
        facebookProfile: 'f_5',
    }).lean()
    data.account5_Id = account5._id.toString()
    const account6 = await Account.findOne({
        facebookProfile: 'f_6',
    }).lean()
    data.account6_Id = account6._id.toString()
    const account7 = await Account.findOne({
        facebookProfile: 'f_7',
    }).lean()
    data.account7_Id = account7._id.toString()
    const account8 = await Account.findOne({
        facebookProfile: 'f_8',
    }).lean()
    data.account8_Id = account8._id.toString()
    const account9 = await Account.findOne({
        facebookProfile: 'f_9',
    }).lean()
    data.account9_Id = account9._id.toString()
    const account10 = await Account.findOne({
        facebookProfile: 'f_10',
    }).lean()
    data.account10_Id = account10._id.toString()
    const account11 = await Account.findOne({
        facebookProfile: 'f_11',
    }).lean()
    data.account11_Id = account11._id.toString()
}
