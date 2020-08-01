const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const wishlistItemSchema = new mongoose.Schema(
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
        itemId: { type: String, required: true, maxlength: mongoLength.id },
        post: [String],
    },
    { minimize: false, _id: false, id: false }
)

module.exports = wishlistItemSchema
