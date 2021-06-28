const basicNames = [
    'account',
    'answer',
    'comment',
    'club',
    'plugin',
    'question',
    'reputation',
]

module.exports = basicNames.reduce(
    (res, current) => res.concat([current, `${current}D`]),
    []
)
