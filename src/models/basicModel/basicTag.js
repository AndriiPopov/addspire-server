const { mongoLength } = require('../../config/fieldLength')

module.exports = {
    type: String,
    maxlength: mongoLength.tag.max,
    minlength: mongoLength.tag.min,
}
