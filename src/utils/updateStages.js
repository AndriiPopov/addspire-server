var moment = require('moment') // require

const isEqual = require('lodash.isequal')
const { Progress } = require('../models/progress')
moment().format()

const getStages = progress => {
    let stages = [],
        start
    switch (progress.goal.repeat) {
        case 'no':
            progress.currentId = progress.currentId + 1
            stages.push({
                stageId: 'stage_' + progress.currentId,
                approvedBy: [],
                paid: [],
                status: 'Due',
            })
            break
        case 'day':
            start = moment().subtract(3, 'd')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'd')
                progress.currentId = progress.currentId + 1
                stages.push({
                    stageId: 'stage_' + progress.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                    year: start.year(),
                    day: start.dayOfYear(),
                })
            }
            break
        case 'week':
            start = moment().subtract(3, 'w')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'w')
                progress.currentId = progress.currentId + 1
                stages.push({
                    stageId: 'stage_' + progress.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                    year: start.weekYear(),
                    week: start.week(),
                })
            }
            break
        case 'month':
            start = moment().subtract(3, 'm')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'm')
                progress.currentId = progress.currentId + 1
                stages.push({
                    stageId: 'stage_' + progress.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                    year: start.year(),
                    month: start.month(),
                })
            }
            break
        case 'year':
            start = moment().subtract(3, 'y')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'y')
                progress.currentId = progress.currentId + 1
                stages.push({
                    stageId: 'stage_' + progress.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                    year: start.year(),
                })
            }
            break
        case 'weekday':
            if (!progress.goal.days || progress.goal.days.length === 0) {
                progress.currentId = progress.currentId + 1
                stages.push({
                    stageId: 'stage_' + progress.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                })
            } else {
                const days = progress.goal.days
                    .sort()
                    .map(item => parseInt(item))

                const getDayBack = (lastDay, forward, firstDay) => {
                    if (!lastDay) lastDay = moment()
                    let current
                    if (!forward) {
                        let lastThisWeek = -1
                        for (let i of days)
                            if (i < lastDay.day()) lastThisWeek = i
                        current = lastDay.day(
                            lastThisWeek === -1
                                ? days[days.length - 1] - 7
                                : lastThisWeek
                        )
                    } else {
                        let lastThisWeek = -1
                        for (let i of days)
                            if (
                                i > lastDay.day() ||
                                (i == lastDay.day() && firstDay)
                            )
                                lastThisWeek = i
                        current = lastDay.day(
                            parseInt(
                                lastThisWeek === -1 ? days[0] + 7 : lastThisWeek
                            )
                        )
                    }
                    progress.currentId = progress.currentId + 1
                    const stage = {
                        stageId: 'stage_' + progress.currentId,
                        approvedBy: [],
                        paid: [],
                        status: 'Due',
                        year: current.year(),
                        day: current.dayOfYear(),
                    }
                    if (!forward) stages.unshift(stage)
                    else stages.push(stage)
                    return lastDay
                }

                let lastDay = getDayBack(null)
                lastDay = getDayBack(lastDay)
                getDayBack(lastDay)
                lastDay = getDayBack(null, true, true)
                lastDay = getDayBack(lastDay, true)
                getDayBack(lastDay, true)
            }
            break
        default:
            break
    }
    return stages
}

module.exports.updateStages = (progress, prevGoal) => {
    let stages = []

    if (
        !prevGoal ||
        prevGoal.repeat !== progress.goal.repeat ||
        !isEqual(prevGoal.days, progress.goal.days)
    ) {
        progress.stages.map(item => ({ ...item, old: true }))
        stages = getStages(progress)
    }
    progress.stages = [...progress.stages, ...stages]
}

module.exports.updateStagesAuto = () => {
    const doUpdate = async () => {
        const progresses = await Progress.find()
        for (let progress of progresses) {
            if (
                progress.goal.repeat === 'no' ||
                (progress.goal.repeat === 'weekday' &&
                    progress.goal.days.length === 0)
            )
                return

            let stages = [],
                needToSave

            stages = getStages(progress)

            const oldStagesSlice = progress.stages
                .slice(Math.max(progress.stages.length - 10, 0))
                .filter(item => !item.old)

            for (let stage of stages) {
                if (
                    !oldStagesSlice.find(
                        item =>
                            item.year === stage.year &&
                            item.month === stage.month &&
                            item.week === stage.week &&
                            item.day === stage.day
                    )
                ) {
                    progress.stages.push(stage)
                    needToSave = true
                }
            }

            if (needToSave) progress.save()
        }
    }
    setTimeout(doUpdate, 60000)
    setInterval(doUpdate, 43200000)
}
