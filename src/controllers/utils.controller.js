const catchAsync = require('../utils/catchAsync')
const grades = require('../config/grades')
const fieldLength = require('../config/fieldLength')
const value = require('../config/value')

const getGrades = catchAsync(async (req, res) => {
    res.send({
        grades,
        constValues: value,
        fieldLength: fieldLength.JoiLength,
    })
})

module.exports = {
    getGrades,
}
