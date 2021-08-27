const dayjs = require('dayjs')

module.exports = (date, tomorrow) => {
    const dayCoef =
        (dayjs().diff(dayjs(date), 'day') + (tomorrow ? 1 : 0)) / 365 - 2

    const t = 0.6 * dayCoef

    return 80000 * (1 / (t + 4) ** (t ** 4))
}
