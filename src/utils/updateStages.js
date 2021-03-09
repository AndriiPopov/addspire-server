var moment = require('moment') // require

const isEqual = require('lodash.isequal')
const { ProgressStep } = require('../models/progressStep')
moment().format()

const getStages = pS => {
    let stages = [],
        start
    switch (pS.repeat) {
        case 'no':
            pS.currentId = pS.currentId + 1
            stages.push({
                stageId: 'stage_' + pS.currentId,
                status: 'process',
                repeat: pS.repeat,
            })
            break
        case 'day':
            start = moment().subtract(3, 'd')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'd')
                pS.currentId = pS.currentId + 1
                stages.push({
                    stageId: 'stage_' + pS.currentId,
                    status: 'process',
                    year: start.year(),
                    day: start.dayOfYear(),
                    repeat: pS.repeat,
                })
            }
            break
        case 'week':
            start = moment().subtract(3, 'w')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'w')
                pS.currentId = pS.currentId + 1
                stages.push({
                    stageId: 'stage_' + pS.currentId,
                    status: 'process',
                    year: start.weekYear(),
                    week: start.week(),
                    repeat: pS.repeat,
                })
            }
            break
        case 'month':
            start = moment().subtract(3, 'M')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'M')
                pS.currentId = pS.currentId + 1
                stages.push({
                    stageId: 'stage_' + pS.currentId,
                    status: 'process',
                    year: start.year(),
                    month: start.month(),
                    repeat: pS.repeat,
                })
            }
            break
        case 'year':
            start = moment().subtract(3, 'y')
            for (let i = 0; i < 6; i++) {
                start.add(1, 'y')
                pS.currentId = pS.currentId + 1
                stages.push({
                    stageId: 'stage_' + pS.currentId,
                    status: 'process',
                    year: start.year(),
                    repeat: pS.repeat,
                })
            }
            break
        case 'weekday':
            if (!pS.days || pS.days.length === 0) {
                pS.currentId = pS.currentId + 1
                stages.push({
                    stageId: 'stage_' + pS.currentId,
                    status: 'process',
                    repeat: pS.repeat,
                })
            } else {
                const days = pS.days.sort().map(item => parseInt(item))

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
                        for (let i of days) {
                            if (
                                i > lastDay.day() ||
                                (i === lastDay.day() && firstDay)
                            ) {
                                lastThisWeek = i
                                break
                            }
                        }
                        current = lastDay.day(
                            parseInt(
                                lastThisWeek === -1 ? days[0] + 7 : lastThisWeek
                            )
                        )
                    }
                    pS.currentId = pS.currentId + 1
                    const stage = {
                        stageId: 'stage_' + pS.currentId,
                        status: 'process',
                        year: current.year(),
                        day: current.dayOfYear(),
                        repeat: pS.repeat,
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

module.exports.updateStages = (pS, prevPS) => {
    if (pS.status !== 'process') return
    let stages = []

    if (
        !prevPS ||
        prevPS.repeat !== pS.repeat ||
        !isEqual(prevPS.days, pS.days)
    ) {
        for (let item of pS.stages) {
            item.old = true
        }

        stages = getStages(pS)
    }
    pS.stages = [...pS.stages, ...stages]
}

module.exports.updateStagesAuto = () => {
    const doUpdate = async () => {
        const pSs = await ProgressStep.find({
            $and: [
                { status: 'process' },
                {
                    repeat: { $exists: true },
                },
                {
                    repeat: { $ne: 'no' },
                },
            ],
        })
            .select('stages repeat days currentId status __v')
            .exec()
        for (let pS of pSs) {
            if (
                pS.repeat === 'no' ||
                (pS.repeat === 'weekday' && pS.days.length === 0)
            )
                return

            let stages = [],
                needToSave

            const oldStagesSlice = pS.stages
                .slice(Math.max(pS.stages.length - 10, 0))
                .filter(item => !item.old)
            if (
                oldStagesSlice.length > 9 &&
                !oldStagesSlice.find(item => item.status !== 'process')
            ) {
                pS.status = 'paused'
                pS.save()
            } else {
                stages = getStages(pS)
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
                        pS.stages.push(stage)
                        needToSave = true
                    }
                }

                if (needToSave) pS.save()
            }
        }
    }
    setTimeout(doUpdate, 6000)
    setInterval(doUpdate, 43200000)
}
