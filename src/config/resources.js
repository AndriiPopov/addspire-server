// All available collections that we use for change streams for real time updates.
const basicNames = [
    'account',
    'answer',
    'comment',
    'club',
    'plugin',
    'question',
    'reputation',
    'imageData',
]

module.exports = basicNames.reduce(
    (res, current) => res.concat([current, `${current}D`]),
    []
)
