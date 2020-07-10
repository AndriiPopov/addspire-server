const {
  requestProgress,
  sendMessage,
  changeLikesMessage,
  changeStage,
  getFriendsData,
  editGoalInProgress,
  leaveProgress
} = require('../wsActions/progress');

const {
  auth
} = require('../wsActions/auth');

const {
  pushChanges
} = require('../wsActions/pushChanges');

const {
  heartbeat
} = require('../wsActions/heartbeat');

const {
  sendError
} = require('../wsActions/error');

const {
  Server
} = require('ws');

const connectSocket = server => {
  try {
    const wss = new Server({
      server
    });
    setTimeout(() => pushChanges(wss), 4000);
    wss.on('connection', function connection(ws) {
      ws.progressId = '';
      ws.isAlive = true;
      ws.createdTime = Date.now();
      ws.on('message', async message => {
        try {
          const data = JSON.parse(message); // console.log(data)

          switch (data.messageCode) {
            case 'heartbeat':
              heartbeat(ws, data);
              break;

            case 'auth':
              auth(ws, data);
              break;

            case 'requestProgress':
              requestProgress(data, ws);
              break;

            case 'sendMessage':
              sendMessage(data, ws);
              break;

            case 'changeStage':
              changeStage(data, ws);
              break;

            case 'leaveProgress':
              leaveProgress(data, ws);
              break;

            case 'likeMessage':
            case 'removeLikeMessage':
            case 'dislikeMessage':
            case 'removeDislikeMessage':
              changeLikesMessage(data, ws);
              break;

            case 'getFriendsData':
              getFriendsData(data, ws);
              break;

            case 'editGoalInProgress':
              editGoalInProgress(data, ws);
              break;

            default:
              break;
          }
        } catch (rejRes) {
          console.log(rejRes);
          sendError(ws, 'Your connection with server is overloaded. Please try again later.');
        }
      });
      ws.on('close', async () => {});
    });
    const interval = setInterval(() => {
      wss.clients.forEach(async ws => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.send(JSON.stringify({
          messageCode: 'heartbeat'
        }));
      });
    }, 30000);
  } catch (ex) {}
};

module.exports = connectSocket;