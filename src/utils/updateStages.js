var moment = require('moment') // require

const isEqual = require('lodash.isequal')
const { Progress } = require('../models/progress')
const { Activity } = require('../models/activity')
moment().format()

const getStages = activity => {
    let stages = [],
        start
    switch (activity.repeat) {
        case 'no':
            activity.currentId = activity.currentId + 1
            stages.push({
                stageId: 'stage_' + activity.currentId,
                approvedBy: [],
                paid: [],
                status: 'Due',
                repeat: activity.repeat,
            })
            break
        case 'day':
            start = moment().subtract(3, 'd')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'd')
                activity.currentId = activity.currentId + 1
                stages.push({
                    stageId: 'stage_' + activity.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                    year: start.year(),
                    day: start.dayOfYear(),
                    repeat: activity.repeat,
                })
            }
            break
        case 'week':
            start = moment().subtract(3, 'w')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'w')
                activity.currentId = activity.currentId + 1
                stages.push({
                    stageId: 'stage_' + activity.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                    year: start.weekYear(),
                    week: start.week(),
                    repeat: activity.repeat,
                })
            }
            break
        case 'month':
            start = moment().subtract(3, 'm')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'm')
                activity.currentId = activity.currentId + 1
                stages.push({
                    stageId: 'stage_' + activity.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                    year: start.year(),
                    month: start.month(),
                    repeat: activity.repeat,
                })
            }
            break
        case 'year':
            start = moment().subtract(3, 'y')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'y')
                activity.currentId = activity.currentId + 1
                stages.push({
                    stageId: 'stage_' + activity.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                    year: start.year(),
                    repeat: activity.repeat,
                })
            }
            break
        case 'weekday':
            if (!activity.days || activity.days.length === 0) {
                activity.currentId = activity.currentId + 1
                stages.push({
                    stageId: 'stage_' + activity.currentId,
                    approvedBy: [],
                    paid: [],
                    status: 'Due',
                    repeat: activity.repeat,
                })
            } else {
                const days = activity.days.sort().map(item => parseInt(item))

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
                    activity.currentId = activity.currentId + 1
                    const stage = {
                        stageId: 'stage_' + activity.currentId,
                        approvedBy: [],
                        paid: [],
                        status: 'Due',
                        year: current.year(),
                        day: current.dayOfYear(),
                        repeat: activity.repeat,
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

module.exports.updateStages = (activity, prevActivity) => {
    let stages = []

    if (
        !prevActivity ||
        prevActivity.repeat !== activity.repeat ||
        !isEqual(prevActivity.days, activity.days)
    ) {
        activity.stages.map(item => ({ ...item, old: true }))
        stages = getStages(activity)
    }
    activity.stages = [...activity.stages, ...stages]
}

module.exports.updateStagesAuto = () => {
    const doUpdate = async () => {
        const activities = await Activity.find()
        for (let activity of activities) {
            if (
                activity.repeat === 'no' ||
                (activity.repeat === 'weekday' && activity.days.length === 0)
            )
                return

            let stages = [],
                needToSave

            stages = getStages(activity)

            const oldStagesSlice = activity.stages
                .slice(Math.max(activity.stages.length - 10, 0))
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
                    activity.stages.push(stage)
                    needToSave = true
                }
            }

            if (needToSave) activity.save()
        }
    }
    setTimeout(doUpdate, 60000)
    setInterval(doUpdate, 43200000)
}
