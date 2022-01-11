const mongoose = require('mongoose')
const { mongoLength } = require('../../config/fieldLength')

const basicTag = require('../basicModel/basicTag')

const profileSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: true,
            maxlength: mongoLength.label.max,
            minlength: mongoLength.label.min,
        },
        name: {
            type: String,
            required: true,
            maxlength: mongoLength.name.max,
            minlength: mongoLength.name.min,
        },
        image: { type: String, default: '' },
        images: [String],
        tags: [basicTag],
        description: {
            type: String,
            maxlength: mongoLength.description.max,
            default: '',
        },
        address: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        phone: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        web: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        email: {
            type: String,
            maxlength: mongoLength.name.max,
            default: '',
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
            },
        },
        locationName: { type: String, default: '' },
        anonym: { type: Boolean, default: false },
    },
    { minimize: false }
)

module.exports = profileSchema
