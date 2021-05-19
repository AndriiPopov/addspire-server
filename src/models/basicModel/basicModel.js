const { mongoLength } = require('../../config/fieldLength');
const notificationSchema = require('../schemas/notification');
const suggestedChangeSchema = require('../schemas/suggestedChangeSchema');

module.exports = {
  settings: {},
  name: {
    type: String,
    required: true,
    default: 'New goal',
    maxlength: mongoLength.name,
  },
  image: String,
  notifications: [notificationSchema],
  edits: [suggestedChangeSchema],
  date: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  tags: [String],
  followers: [String],
  bookmarked: Number,
  views: Number,
};
