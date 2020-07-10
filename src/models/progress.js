const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const { goalSchema, rewardsSchema } = require('./account')
const { updateIfCurrentPlugin } = require('mongoose-update-if-current')
const types = mongoose.Schema.Types

const messageSchema = new mongoose.Schema(
    {
        author: String,
        text: String,
        action: String,
        image: String,
        date: {
            type: Date,
            default: Date.now,
        },
        editedDate: {
            type: Date,
            default: Date.now,
        },
        likes: [String],
        dislikes: [String],
        replies: [],
        messageId: { type: String, required: true },
    },
    { minimize: false, _id: false, id: false }
)

const stageSchema = new mongoose.Schema(
    {
        milestoneId: { type: String, required: true },
        approvedBy: [
            {
                accountId: String,
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        paid: [rewardsSchema],
        status: String,
    },
    { minimize: false, _id: false, id: false }
)

const progressSchema = new mongoose.Schema(
    {
        _id: String,
        messages: [messageSchema],
        worker: String,
        owner: String,
        stages: [stageSchema],
        status: String,
        goal: goalSchema,
        currentId: {
            type: Number,
            default: 0,
            required: true,
        },
        patch: {},
    },
    { minimize: false }
)
progressSchema.plugin(updateIfCurrentPlugin)

module.exports.Progress = mongoose.model('Progress', progressSchema)
