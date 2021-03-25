const mongoose = require('mongoose')
const boardItemSchema = require('./schemas/boardItem')
const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const basicModel = require('./basicModel/basicModel')

const boardSchema = new mongoose.Schema(
    {
        ...basicModel,
        items: [boardItemSchema],
        itemsCount: {
            type: Number,
            default: 0,
        },
    },
    { minimize: false }
)

boardSchema.plugin(updateIfCurrentPlugin)

boardSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Board = mongoose.model('Board', boardSchema)
module.exports.boardSchema = boardSchema
