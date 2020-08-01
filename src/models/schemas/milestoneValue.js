const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const milestonesValueSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            maxlength: mongoLength.id,
        },
        name: {
            type: String,
            required: true,
            default: 'New milestone',
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
        experts: [String],
        supporters: [String],
    },
    { minimize: false, _id: false, id: false }
)

module.exports = milestonesValueSchema
