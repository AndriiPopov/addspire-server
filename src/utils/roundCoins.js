const format = require('format-number')

const roundCoins = (value, truncate) =>
    // value ? Math.round((parseFloat(value) + Number.EPSILON) * 10000) / 10000 : 0
    format({ truncate: typeof truncate === 'number' ? truncate : 4 })(
        parseFloat(value)
    )

module.exports = roundCoins
