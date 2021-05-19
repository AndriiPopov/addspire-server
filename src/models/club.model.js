const mongoose = require('mongoose')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const increaseVersion = require('./plugins/increaseVersion.plugin')
const basicModel = require('./basicModel/basicModel')
const inviteSchema = require('./schemas/inviteSchema')

const clubSchema = new mongoose.Schema(
    {
        ...basicModel,
        reputations: [String],
        reputationsCount: {
            type: Number,
            default: 0,
        },
        questions: [String],
        questionsCount: {
            type: Number,
            default: 0,
        },
        articles: [String],
        articlesCount: {
            type: Number,
            default: 0,
        },
        tagsList: [String],
        private: Boolean,
        responseTime: Number,
        admins: [String],
        description: String,
        invites: [inviteSchema],
        activated: Boolean,
    },
    { minimize: false }
)
clubSchema.plugin(updateIfCurrentPlugin)

clubSchema.pre(
    [
        'update',
        'updateOne',
        'findOneAndUpdate',
        'findByIdAndUpdate',
        'updateMany',
    ],
    increaseVersion
)

module.exports = mongoose.model('Club', clubSchema)
