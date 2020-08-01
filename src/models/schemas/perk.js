const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const perkSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            maxlength: mongoLength.name,
            required: true,
            default: 'New item',
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
        urls: [String],
        users: [String],
        price: Number,
        perkId: { type: String, required: true },
        post: [String],
    },
    { minimize: false, _id: false, id: false }
)

module.exports = perkSchema
