const mongoose = require('mongoose')

const systemSchema = new mongoose.Schema({
    name: { type: String, default: 'system' },
    currentId: {
        type: Number,
        default: 0,
    },
    currentImgId: {
        type: Number,
        default: 0,
    },
    notifications: [],
    lastReplenishDate: String,
    lastViewsRewardDate: String,
    totalCoins: { type: Number, default: 100000000 },
    undestributedCoins: { type: Number, default: 100000000 },
    myCoins: { type: Number, default: 0 },
    date: {
        type: Date,
        default: Date.now,
    },
})

const System = mongoose.model('System', systemSchema)

const getNotificationId = async () => {
    const newId = await System.findOneAndUpdate(
        { name: 'system' },
        { $inc: { currentId: 1 } },
        { new: true, useFindAndModify: false }
    )
    return newId.currentId
}

const getImgId = async () => {
    const newId = await System.findOneAndUpdate(
        { name: 'system' },
        { $inc: { currentImgId: 1 } },
        { new: true, useFindAndModify: false }
    )
    return newId.currentImgId
}
module.exports = { System, getImgId, getNotificationId }
