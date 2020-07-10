const {
  User
} = require('../models/user');

const jwt = require('jsonwebtoken');

const {
  sendError
} = require('./error');

const authenticate = async (data, ws) => {
  try {
    let user;
    const token = data.user;

    if (token) {
      await jwt.verify(token, process.env.jwtPrivateKey, async (err, decoded) => {
        if (err) {
          sendError(ws, 'Login error1.', true);
        } else {
          user = await User.findById(decoded._id);

          if (!user) {
            sendError(ws, 'Login error2.', true);
          }
        }
      });
    }

    return user;
  } catch {
    sendError(ws, 'Login error.3', true);
    return false;
  }
};

module.exports.auth = async (ws, data) => {
  try {
    let user = await authenticate(data, ws);

    if (user) {
      ws.progressId = data.progressId;
    } else {
      sendError(ws, 'Login error.4', true);
    }
  } catch (ex) {
    sendError(ws, 'Login error.5', true);
  }
};