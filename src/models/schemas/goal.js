const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')
const milestoneSchema = require('./milestone')
const milestonesValueSchema = require('./milestoneValue')
const rewardsSchema = require('./reward')

const goalSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            default: 'New goal',
            maxlength: mongoLength.name,
        },
        description: {
            type: String,
            default: '',
            maxlength: mongoLength.description,
        },
        descriptionText: {
            type: String,
            default: '',
            maxlength: mongoLength.description,
        },
        images: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
        privacy: {
            type: String,
            enum: ['public', 'private'],
            required: true,
            default: 'public',
        },
        users: [String],
        followingAccounts: [String],
        rewards: [rewardsSchema],
        currentId: { type: Number, default: 0 },
        post: [String],
        owner: String,
        repeat: String,
        days: [String],
        position: {},
        nomap: Boolean,
    },
    { minimize: false, _id: false, id: false }
)

module.exports = goalSchema
