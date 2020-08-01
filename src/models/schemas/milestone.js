const mongoose = require('mongoose')
const { mongoLength } = require('../../constants/fieldLength')

const milestoneSchema = new mongoose.Schema(
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
    },
    { minimize: false, _id: false, id: false }
)

module.exports = milestoneSchema
