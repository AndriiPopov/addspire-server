const mongoose = require('mongoose');
const { updateIfCurrentPlugin } = require('mongoose-update-if-current');
const increaseVersion = require('./plugins/increaseVersion.plugin');
const { mongoLength } = require('../config/fieldLength');

const commentSchema = new mongoose.Schema(
  {
    author: String,
    text: { type: String, maxlength: mongoLength.message },
    image: [String],
    date: {
      type: Date,
      default: Date.now,
    },
    editedDate: {
      type: Date,
      default: Date.now,
    },
    votesUp: [String],
    votesDown: [String],
    isReply: Boolean,
  },
  { minimize: false }
);

commentSchema.plugin(updateIfCurrentPlugin);

commentSchema.pre(['update', 'updateOne', 'findOneAndUpdate', 'findByIdAndUpdate', 'updateMany'], increaseVersion);

module.exports.Comment = mongoose.model('Comment', commentSchema);
module.exports.commentSchema = commentSchema;
