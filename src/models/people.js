const mongoose = require('mongoose')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const basicModel = require('./basicModel/basicModel')

const types = mongoose.Types

const peopleSchema = new mongoose.Schema(
    {
        ...basicModel,
        user: String,
        link: String,
        shortDescription: String,
        contact: {},
    },
    { minimize: false }
)
peopleSchema.plugin(updateIfCurrentPlugin)

peopleSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.People = mongoose.model('People', peopleSchema)
