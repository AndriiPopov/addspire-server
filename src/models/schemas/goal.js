const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')
const rewardsGroupSchema = require('./rewardsGroup')
const milestoneSchema = require('./milestone')
const milestonesValueSchema = require('./milestoneValue')

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
        experts: [String],
        supporters: [String],
        users: [String],
        rewardsGroups: [rewardsGroupSchema],
        milestones: [milestoneSchema],
        milestonesValues: [milestonesValueSchema],
        newTabIndex: Number,
        withMilestones: Boolean,
        post: [String],
        owner: String,
    },
    { minimize: false, _id: false, id: false }
)

module.exports = goalSchema
