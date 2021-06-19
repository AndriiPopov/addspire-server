const catchAsync = require('../utils/catchAsync')
const grades = require('../config/grades')

const getGrades = catchAsync(async (req, res) => {
    res.send({
        grades,
    })
})

module.exports = {
    getGrades,
}
