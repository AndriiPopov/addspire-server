const dayjs = require('dayjs')

module.exports = (date) => {
    const dayCoef = dayjs().diff(dayjs(date), 'day') / 365 - 2

    const t = 0.6 * dayCoef

    return 80000 * (1 / (t + 4) ** (t ** 4))
}
