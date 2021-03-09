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

module.exports.createNewAdvice = async (data, ws) => {
    try {
        const { value, start } = data
        const { _id, __v, date, ...sourceVersion } = value

        const newSteps = []

        for (let stepValue of value.steps) {
            if (typeof stepValue === 'string') {
                newSteps.push(stepValue)
            } else {
                const { _id, __v, date, ...sourceStep } = stepValue
                const step = new Step(sourceStep)
                newSteps.push(step._id)
                await step.save()
            }
        }
        const version = new Version({
            ...sourceVersion,
            owner: ws.account,
            steps: newSteps,
            published: true,
        })
        const advice = new Advice({
            owner: ws.account,
            collaborators: [ws.account],
            versions: [version._id],
            currentVersion: version._id,
            name: value.name,
            image: value.images.length ? value.images[0] : '',
        })
        version.advice = advice._id
        await version.save()
        await advice.save()

        const newNotificationId = await getNotificationId()
        await Account.findOneAndUpdate(
            { _id: ws.account },
            {
                $push: {
                    sadmin: advice._id,
                    notifications: {
                        $each: [
                            {
                                user: ws.account,
                                code: 'create new advice',
                                details: {
                                    adviceId: advice._id,
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
        if (start)
            startAdvice({ adviceId: advice._id, versionId: version._id }, ws)
        else sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.editVersion = async (data, ws) => {
    try {
        const { value, progressId, adviceId, suggest, current } = data
        const { _id, __v, date, ...sourceVersion } = value
        const newSteps = []
        const addSteps = []

        for (let stepValue of value.steps) {
            if (typeof stepValue !== 'string') {
                const { _id, __v, date, ...sourceStep } = stepValue
                const step = new Step(sourceStep)
                newSteps.push(step._id)
                await step.save()
                addSteps.push({ id: step._id, value: stepValue })
            } else {
                newSteps.push(stepValue)
            }
        }
        // if (addSteps.length > 0 || newSteps.length !== value.steps.length) {
        const version = new Version({
            ...sourceVersion,
            owner: ws.account,
            steps: newSteps,
            published: Boolean(current),
        })
        await version.save()
        const newNotificationId = await getNotificationId()
        if (suggest) {
            await Advice.updateOne(
                { _id: adviceId },
                {
                    $push: {
                        versions: version._id,
                        pendingVersions: version._id,
                        notifications: {
                            $each: [
                                {
                                    user: ws.account,
                                    code: 'added pending version',
                                    details: {
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
        } else if (current) {
            await Advice.updateOne(
                { _id: adviceId },
                {
                    currentVersion: version._id,
                    image: version.images.length ? version.images[0] : '',
                    $push: {
                        versions: version._id,
                        collaborators: value.owner,
                        notifications: {
                            $each: [
                                {
                                    user: ws.account,
                                    code: 'new version',
                                    details: {
                                        adviceId,
                                    },
                                    notId: newNotificationId,
                                },
                            ],
                            $slice: -20,
                        },
                    },
                    $pull: {
                        pendingVersions: value._id,
                    },
                },
                { useFindAndModify: false }
            )
        } else
            await Advice.updateOne(
                { _id: adviceId },
                { $push: { versions: version._id } },
                { useFindAndModify: false }
            )

        if (progressId) {
            const progress = await Progress.findById(progressId)
            if (progress) {
                progress.version = version._id
                for (let step of addSteps) {
                    const progressStep = new ProgressStep({
                        step: step.id,
                        repeat: step.value.repeat,
                        days: step.value.days,
                        status: 'process',
                        progress: progress._id,
                    })
                    progress.progressSteps.push(progressStep._id)
                    updateStages(progressStep)
                    await progressStep.save()
                }
                await progress.save()
            }
        }
        // }
        sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.addAdmin = async (data, ws) => {
    try {
        const { adviceId, userId } = data
        await Advice.updateOne(
            { _id: adviceId },
            {
                $push: { admins: userId },
            },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
module.exports.deleteAdmin = async (data, ws) => {
    try {
        const { adviceId, userId } = data
        await Advice.updateOne(
            { _id: adviceId },
            { $pull: { admins: userId, sadmins: userId } },
            { useFindAndModify: false }
        )
        sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
module.exports.setSAdmin = async (data, ws) => {
    try {
        const { adviceId, userId, add } = data

        await Advice.updateOne(
            { _id: adviceId },
            {
                $pull: { [add ? 'admins' : 'sadmins']: userId },
                $addToSet: {
                    [add ? 'sadmins' : 'admins']: userId,
                },
            },
            { useFindAndModify: false }
        )

        sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.reviewVersion = async (data, ws) => {
    try {
        const { adviceId, value, accept } = data
        if (!accept || !value) {
            await Advice.updateOne(
                { _id: adviceId },
                { $pull: { pendingVersions: value._id } },
                { useFindAndModify: false }
            )
        } else {
            this.editVersion({ ...data, current: true }, ws)
        }

        sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}

module.exports.changeVersion = async (data, ws) => {
    try {
        const { versionId, progressId } = data
        const version = await Version.findById(versionId)
            .select('steps')
            .lean()
            .exec()
        const newSteps = []
        if (version) {
            for (let step of version.steps) {
                const stepObj = await Step.findById(step)
                    .select('repeat days')
                    .lean()
                    .exec()
                if (stepObj) {
                    let progressStep = await ProgressStep.findOne({
                        step,
                        progress: progressId,
                    })
                    if (!progressStep)
                        progressStep = new ProgressStep({
                            step,
                            repeat: stepObj.repeat,
                            days: stepObj.days,
                            status: 'process',
                            progress: progressId,
                        })
                    newSteps.push(progressStep._id)
                    updateStages(progressStep)
                    await progressStep.save()
                }
            }

            await Progress.updateOne(
                { _id: progressId },
                {
                    $push: { progressSteps: { $each: newSteps } },
                    version: versionId,
                },
                { useFindAndModify: false }
            )
        }

        sendSuccess(ws, 'The new Advice is created')
    } catch (ex) {
        console.log(ex)
        sendError(ws, 'Bad data!')
    }
}
