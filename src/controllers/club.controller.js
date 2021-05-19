const httpStatus = require('http-status')
const catchAsync = require('../utils/catchAsync')
const { clubService } = require('../services')

const createClub = catchAsync(async (req, res) => {
    console.log('heere')

    const club = await clubService.createClub(req)
    res.status(httpStatus.CREATED).send({
        redirect: {
            type: 'club',
            _id: club._id,
        },
    })
})

module.exports = {
    createClub,
}
