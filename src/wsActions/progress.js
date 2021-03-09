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

module.exports.startAdvice = async (data, ws) => {
    try {
        const { adviceId, versionId } = data

        const progress = new Progress({
            advice: adviceId,
            version: versionId,
            owner: ws.account,
        })
        const newNotificationId = await getNotificationId()

        const account = await Account.findOneAndUpdate(
            {
                $and: [
                    { _id: ws.account },
                    { currentAdvices: { $ne: adviceId } },
                ],
            },

            {
                $push: {
                    currentAdvices: adviceId,
                },
            },
            { useFindAndModify: false, new: true, fields: { _id: 1 } }
        )
        if (account) {
            const version = await Version.findById(versionId)
                .select('steps')
                .lean()
                .exec()
            if (version) {
                for (let item of version.steps) {
                    const step = await Step.findById(item)
                        .select('repeat days')
                        .lean()
                        .exec()
                    if (!step) return
                    const progressStep = new ProgressStep({
                        step: step._id,
                        repeat: step.repeat,
                        days: step.days,
                        status: 'process',
                        progress: progress._id,
                    })
                    progress.progressSteps.push(progressStep._id)

                    updateStages(progressStep)
                    await progressStep.save()
                }
                await progress.save()
                await Account.updateOne(
                    { _id: ws.account },
                    {
                        $push: {
                            progresses: progress._id,
                            notifications: {
                                $each: [
                                    {
                                        user: ws.account,
                                        code: 'new progress',
                                        details: {
                                            progressId: progress._id,
                                            adviceId,
                                        },
                                        notId: newNotificationId,
                                    },
                                ],
                                $slice: -20,
                            },
                        },
                        $inc: { progressesCount: 1 },
                    },
                    { useFindAndModify: false }
                )
                await Advice.updateOne(
                    { _id: adviceId },
                    {
                        $push: {
                            progresses: progress._id,
                            notifications: {
                                $each: [
                                    {
                                        user: ws.account,
                                        code: 'new progress',
                                        details: {
                                            progressId: progress._id,
                                            adviceId,
                                        },
                                        notId: newNotificationId,
                                    },
                                ],
                                $slice: -20,
                            },
                        },
                        $inc: { progressesCount: 1 },
                        $addToSet: {
                            currentUsers: ws.account,
                        },
                    },
                    { useFindAndModify: false }
                )
                if (
                    !(await Advice.exists({
                        _id: adviceId,
                        users: { $elemMatch: { $eq: ws.account } },
                    }))
                ) {
                    await Advice.updateOne(
                        { _id: adviceId },
                        {
                            $push: {
                                users: ws.account,
                                currentUsers: ws.account,
                            },
                            $inc: { usersCount: 1 },
                        },
                        { useFindAndModify: false }
                    )
                }
                sendSuccess(ws, 'You have started the Advice/goal')
                ws.send(
                    JSON.stringify({
                        messageCode: 'goTo',
                        messageText:
                            '/advice/' + adviceId + '?p=' + progress._id,
                    })
                )
            }
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.setProgressStepStatus = async (data, ws) => {
    try {
        const { status, progressStepId } = data
        if (status === 'process') {
            const progressStep = await ProgressStep.findById(progressStepId)

            if (progressStep) {
                progressStep.status = status
                updateStages(progressStep)
                progressStep.save()
                sendSuccess(ws, 'Status changed')
            }
        } else {
            await ProgressStep.updateOne(
                { _id: progressStepId },
                { status },
                { useFindAndModify: false }
            )

            sendSuccess(ws, 'Status changed')
        }
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.changeProgressStatus = async (data, ws) => {
    try {
        const { status, progressId } = data
        await Progress.updateOne(
            { _id: progressId },
            { status },
            { useFindAndModify: false }
        )

        sendSuccess(ws, 'Status changed')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.changeStage = async (data, ws) => {
    try {
        const { status, progressStepId, stageId } = data
        await ProgressStep.updateOne(
            { _id: progressStepId, 'stages.stageId': stageId },
            { $set: { 'stages.$.status': status } },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'Status changed')
    } catch (ex) {
        console.log(ex)
        sendError(ws)
    }
}

module.exports.changeProgressStepRepeat = async (data, ws) => {
    try {
        const { progressStepId, repeat, days } = data

        const progressStep = await ProgressStep.findById(progressStepId)

        if (progressStep) {
            const prevProgressStep = progressStep.toObject()
            progressStep.repeat = repeat
            progressStep.days = days
            updateStages(progressStep, prevProgressStep)
            progressStep.save()
            sendSuccess(ws, 'Status changed')
        }
        // await ProgressStep.updateOne(
        //     { _id: progressStepId },
        //     { repeat, days },
        //     { useFindAndModify: false,  }
        // )
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.changeProgressStepNote = async (data, ws) => {
    try {
        const { progressStepId, note } = data

        await ProgressStep.updateOne(
            { _id: progressStepId },
            { description: note },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'Status changed')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
