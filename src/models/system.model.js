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
})

const System = mongoose.model('System', systemSchema)

const getNotificationId = async () => {
    const newId = await System.findOneAndUpdate(
        { name: 'system' },
        { $inc: { currentId: 1 } },
        { new: true }
    )
    return newId.currentId
}

const getImgId = async () => {
    const newId = await System.findOneAndUpdate(
        { name: 'system' },
        { $inc: { currentImgId: 1 } },
        { new: true }
    )
    return newId.currentImgId
}
module.exports = { System, getImgId, getNotificationId }
