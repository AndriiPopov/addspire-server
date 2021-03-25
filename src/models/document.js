const mongoose = require('mongoose')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const basicModel = require('./basicModel/basicModel')

const types = mongoose.Types

const documentSchema = new mongoose.Schema(
    {
        ...basicModel,
        url: String,
    },
    { minimize: false }
)
documentSchema.plugin(updateIfCurrentPlugin)

documentSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Document = mongoose.model('Document', documentSchema)
