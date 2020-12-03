module.exports = stage => {
    let aF, aS
    if (a.day) {
        aS = dayjs()
            .year(a.year)
            .dayOfYear(a.day)
            .startOf('day')
        aF = dayjs()
            .year(a.year)
            .dayOfYear(a.day)
            .endOf('day')
    } else if (a.week) {
        aS = dayjs()
            .year(a.year)
            .week(a.week)
            .startOf('week')
        aF = dayjs()
            .year(a.year)
            .week(a.week)
            .endOf('week')
    } else if (a.month) {
        aS = dayjs()
            .year(a.year)
            .month(a.month)
            .startOf('month')
        aF = dayjs()
            .year(a.year)
            .month(a.month)
            .endOf('month')
    } else if (a.year) {
        aS = dayjs()
            .year(a.year)
            .startOf('year')
        aF = dayjs()
            .year(a.year)
            .endOf('year')
    }
    return { strt: aS, end: aF }
}
