const mongoose = require('mongoose')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const basicModel = require('./basicModel/basicModel')

const types = mongoose.Types

const surveySchema = new mongoose.Schema(
    {
        ...basicModel,
        url: String,
    },
    { minimize: false }
)
surveySchema.plugin(updateIfCurrentPlugin)

surveySchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Survey = mongoose.model('Survey', surveySchema)
