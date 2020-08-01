const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const friendSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ['invited', 'inviting', 'friend'],
            required: true,
            default: 'inviting',
        },
        friend: { type: String, maxlength: mongoLength.name, required: true },
        posts: [String],
    },

    { minimize: false, _id: false, id: false }
)

module.exports = friendSchema
