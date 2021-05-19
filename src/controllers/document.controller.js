const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const getResourcesFromList = require('../utils/getResourcesFromList');
const resources = require('../config/resources');
const getModelFromType = require('../utils/getModelFromType');

const poll = {};
const getResource = catchAsync(async (req, res) => {
  const data = req.body;

  const [result, onlineUsers] = await getResourcesFromList(data);

  if (result && result.length > 0) {
    res.send({
      messageCode: 'addResource',
      type: data.type,
      resources: result.filter((item) => item),
      newOnlineUsers: onlineUsers,
    });
    return;
  }
  res.send({
    messageCode: 'notFoundResource',
    _id: data.ids,
  });
});

const pollResource = catchAsync(async (req, res) => {
  const data = req.body;
  req.on('close', () => {
    delete poll[`${data.type}_${data.id}`];
  });
  const model = getModelFromType(data.type);
  const resource = await model.findById(data.id).select('__v').lean().exec();
  if (resource) {
    if (resource.__v === data.__v || data.__v === -1) {
      poll[`${data.type}_${data.id}`] = res;
    } else {
      const [result, onlineUsers] = await getResourcesFromList({ ...data, ids: [data.id] });
      res.send({
        messageCode: 'addResource',
        type: data.type,
        resources: result.filter((item) => item),
        newOnlineUsers: onlineUsers,
      });
    }
  } else {
    res.send({
      messageCode: 'no resource',
    });
  }
});

const sendUpdatedData = (data, keys) => {
  keys.forEach((key) => {
    if (typeof poll[`${key}_${data.documentKey._id.toString()}`] !== 'undefined') {
      poll[`${key}_${data.documentKey._id.toString()}`].send({
        messageCode: 'updateResource',
        code: key,
        id: data.documentKey._id.toString(),
        update: data.updateDescription,
      });
    }
    // }
  });
};

module.exports = {
  getResource,
  pollResource,
  sendUpdatedData,
};
