const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const types = mongoose.Types
const milestoneSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            maxlength: 100,
        },
        name: {
            type: String,
            required: true,
            default: 'New milestone',
            maxlength: 100,
        },
    },
    { minimize: false, _id: false, id: false }
)

const milestonesValueSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            maxlength: 100,
        },
        name: {
            type: String,
            required: true,
            default: 'New milestone',
            maxlength: 100,
        },
        description: {
            type: String,
            default: '',
            maxlength: 3000,
        },
        images: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
        experts: [String],
        supporters: [String],
    },
    { minimize: false, _id: false, id: false }
)

const progressSchema = new mongoose.Schema(
    {
        progressId: { type: String, required: true },
        userId: { type: String, required: true },
    },
    { minimize: false, _id: false, id: false }
)

const moneySchema = new mongoose.Schema(
    {
        user: String,
        amount: { type: Number, min: 0, default: 0 },
    },

    { minimize: false, _id: false, id: false }
)

const wishListItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            maxlength: 500,
            required: true,
            default: 'New item',
        },
        description: {
            type: String,
            default: '',
            maxlength: 3000,
        },
        images: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
        urls: [String],
    },
    { minimize: false, _id: false, id: false }
)
const rewardsSchema = new mongoose.Schema(
    {
        mode: {
            type: String,
            enum: ['simple', 'money', 'item'],
            required: true,
        },
        simple: String,
        money: Number,
        itemName: String,
        itemDescription: String,
        itemImages: [String],
    },
    { minimize: false, _id: false, id: false }
)
const rewardsGroupSchema = new mongoose.Schema(
    {
        key: { type: String, required: true },
        rewards: [rewardsSchema],
    },
    { minimize: false, _id: false, id: false }
)

const goalSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            default: 'New goal',
            maxlength: 500,
        },
        description: {
            type: String,
            default: '',
            maxlength: 3000,
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
        progresses: [progressSchema],
        goalId: { type: String, required: true },
    },
    { minimize: false, _id: false, id: false }
)

const friendSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ['invited', 'inviting', 'friend'],
            required: true,
            default: 'inviting',
        },
        friend: String,
    },

    { minimize: false, _id: false, id: false }
)

const perkSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            maxlength: 500,
            required: true,
            default: 'New item',
        },
        description: {
            type: String,
            default: '',
            maxlength: 3000,
        },
        images: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
        urls: [String],
        users: [String],
        price: Number,
        perkId: { type: String, required: true },
    },
    { minimize: false }
)

const wishlistItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            maxlength: 500,
            required: true,
            default: 'New item',
        },
        description: {
            type: String,
            default: '',
            maxlength: 3000,
        },
        images: [
            {
                type: String,
                default: '',
                maxlength: 500,
            },
        ],
        urls: [String],
        itemId: { type: String, required: true },
    },
    { minimize: false }
)

const accountSchema = new mongoose.Schema(
    {
        name: { type: String, minlength: 2, required: true },
        _id: String,
        image: { type: Number, default: 0 },
        settings: {},
        isTeam: Boolean,
        goals: [goalSchema],
        progresses: [String],
        perks: [perkSchema],
        wishlist: [wishlistItemSchema],
        wallet: [moneySchema],
        transactions: [String],
        friends: [friendSchema],
        currentId: {
            type: Number,
            default: 0,
            required: true,
        },
        users: [String],
        status: {
            type: String,
            default: 'notactivated',
            enum: ['notactivated', 'activated'],
            required: true,
        },
    },
    { minimize: false }
)

module.exports.Account = mongoose.model('Account', accountSchema)
module.exports.goalSchema = goalSchema
module.exports.rewardsSchema = rewardsSchema
