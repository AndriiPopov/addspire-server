const mongoose = require('mongoose')
const stepSchema = require('./schemas/step')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const basicModel = require('./basicModel/basicModel')

const adviceSchema = new mongoose.Schema(
    {
        ...basicModel,
        progresses: [String],
        progressesCount: {
            type: Number,
            default: 0,
        },
        steps: [stepSchema],
        category: [String],
    },
    { minimize: false }
)

adviceSchema.plugin(updateIfCurrentPlugin)

adviceSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Advice = mongoose.model('Advice', adviceSchema)
module.exports.adviceSchema = adviceSchema
