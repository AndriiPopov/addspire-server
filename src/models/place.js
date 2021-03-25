const mongoose = require('mongoose')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const basicModel = require('./basicModel/basicModel')

const types = mongoose.Types

const placeSchema = new mongoose.Schema(
    {
        ...basicModel,
        position: {},
    },
    { minimize: false }
)
placeSchema.plugin(updateIfCurrentPlugin)

placeSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Place = mongoose.model('Place', placeSchema)
