const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { sendError, sendSuccess } = require('./confirm')
const { getNotificationId } = require('../models/system')
const addNotification = require('../utils/addNotification')
const { Version } = require('../models/version')
const { Advice } = require('../models/advice')
const { Step } = require('../models/step')
const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const { ProgressStep } = require('../models/progressStep')
const { updateStages } = require('../utils/updateStages')
const { startAdvice } = require('./progress')
const { Board } = require('../models/board')

module.exports.createNewBoard = async (data, ws) => {
    try {
        const { value } = data

        const board = new Board({
            owner: ws.account,
            collaborators: [ws.account],
            sadmins: [ws.account],
            name: value.name,
            description: value.description,
            image: value.images.length ? value.images[0] : '',
            images: value.images || [],
            saved: [ws.account],
            savedCount: 1,
        })

        await board.save()
        const newNotificationId = await getNotificationId()
        await Account.updateOne(
            { _id: ws.account },
            {
                $push: {
                    sadminB: board._id,
                    boards: board._id,
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'new board',
                                details: {
                                    boardId: board._id,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: -20,
                    },
                },
                $inc: { boardsCount: 1 },
            },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The new Board is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.saveBoard = async (data, ws) => {
    try {
        const { boardId } = data

        const newNotificationId = await getNotificationId()
        await Board.findOneAndUpdate(
            { _id: boardId },
            {
                $addToSet: { saved: ws.account },
                $inc: { savedCount: 1 },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'save board',
                                details: {
                                    boardId,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: -20,
                    },
                },
            },
            { useFindAndModify: false }
        )
        await Account.findOneAndUpdate(
            { _id: ws.account },
            {
                $addToSet: { boards: boardId },
                $inc: { boardsCount: 1 },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'save board',
                                details: {
                                    boardId,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: -20,
                    },
                },
            },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The new Board is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.editBoard = async (data, ws) => {
    try {
        const { value } = data
        if (value._id) {
            await Board.updateOne(
                { _id: value._id },
                {
                    image: value.images.length ? value.images[0] : '',
                    images: value.images || [],
                    name: value.name,
                    description: value.description,
                },
                { useFindAndModify: false }
            )

            sendSuccess(ws, 'The board is updated')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.editBoardAdvices = async (data, ws) => {
    try {
        const { value, boardId } = data
        await Board.updateOne(
            { _id: boardId },
            {
                items: value,
            },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The board is updated')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.addAdviceToBoard = async (data, ws) => {
    try {
        const { adviceId, boardId } = data
        const newNotificationId = await getNotificationId()
        await Board.updateOne(
            { _id: boardId },
            {
                $addToSet: { items: adviceId },
                $inc: { itemsCount: 1 },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'add advice to board',
                                details: {
                                    boardId,
                                    adviceId,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: -20,
                    },
                },
            },
            { useFindAndModify: false }
        )
        await Advice.updateOne(
            { _id: adviceId },
            {
                $addToSet: { saved: boardId },
                $inc: { savedCount: 1 },
                $push: {
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'add advice to board',
                                details: {
                                    boardId,
                                    adviceId,
                                },
                                notId: newNotificationId,
                            },
                        ],
                        $slice: -20,
                    },
                },
            },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The board is updated')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.deleteAdviceFromBoard = async (data, ws) => {
    try {
        const { adviceId, boardId } = data
        await Board.updateOne(
            { _id: boardId },
            { $pull: { items: adviceId }, $inc: { itemsCount: -1 } },
            { useFindAndModify: false }
        )
        await Advice.updateOne(
            { _id: adviceId },
            { $pull: { saved: boardId }, $inc: { savedCount: -1 } },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The board is updated')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.deleteBoard = async (data, ws) => {
    try {
        const { boardId } = data
        await Board.updateOne(
            { _id: boardId },
            { $pull: { saved: ws.account }, $inc: { savedCount: -1 } },
            { useFindAndModify: false }
        )
        await Account.updateOne(
            { _id: ws.account },
            { $pull: { boards: boardId }, $inc: { boardsCount: -1 } },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The board is updated')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
