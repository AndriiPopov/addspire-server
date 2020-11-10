const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { mongoLength } = require('../constants/fieldLength')

const increaseVersion = require('../utils/increaseVersion')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')

const types = mongoose.Types

const rewardSchema = new mongoose.Schema(
    {
        name: { type: String, maxlength: mongoLength.name },
        description: {},
        descriptionText: String,
        images: [String],
        owner: String,
        progresses: [String],
        post: String,
        likes: [String],
        wish: Boolean,
    },
    { minimize: false }
)

rewardSchema.plugin(updateIfCurrentPlugin)

rewardSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports.Reward = mongoose.model('Reward', rewardSchema)
