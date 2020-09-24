const { auth } = require('../wsActions/auth')
const {
    requestProgress,
    changeStage,
    getFriendsData,
    editGoalInProgress,
    leaveProgress,
    saveReward,
    deleteReward,
    startProgress,
    changeLikesProgress,
} = require('../wsActions/progress')
const {
    sendMessage,
    changeLikesMessage,
    addPost,
} = require('../wsActions/post')
const {
    editAccount,
    deleteAccount,
    followAccount,
    unfollowAccount,
    followProgress,
    unfollowProgress,
} = require('../wsActions/account')
const {
    saveWishlistItem,
    deleteWishlistItem,
} = require('../wsActions/wishlist')
const { savePerk, deletePerk, buyPerk } = require('../wsActions/perks')
const { setLastSeenNot } = require('../wsActions/dashboard')
const {
    searchFriends,
    addFriend,
    acceptFriend,
    unfriend,
} = require('../wsActions/friends')
const {
    cancelTransaction,
    confirmTransaction,
} = require('../wsActions/transactions')

const { pushChanges } = require('../wsActions/pushChanges')
const { heartbeat } = require('../wsActions/heartbeat')
const { requestResource } = require('../wsActions/requestResource')
const { Server } = require('ws')
const { sendError } = require('../wsActions/confirm')

const connectSocket = server => {
    try {
        const wss = new Server({ server })

        setTimeout(() => pushChanges(wss), 4000)

        wss.on('connection', function connection(ws) {
            ws.resources = {
                user: {},
                account: {},
                progress: {},
                post: {},
                transactionData: {},
                friendData: {},
                progressData: {},
                postData: {},
            }
            ws.isAlive = true
            ws.createdTime = Date.now()

            ws.on('message', async message => {
                try {
                    const data = JSON.parse(message)
                    console.log(data)
                    switch (data.messageCode) {
                        case 'heartbeat':
                            heartbeat(ws, data)
                            break
                        case 'auth':
                            auth(ws, data)
                            break
                        case 'requestResource':
                            requestResource(data, ws)
                            break
                        case 'sendMessage':
                            sendMessage(data, ws)
                            break
                        case 'addPost':
                            addPost(data, ws)
                            break
                        case 'changeStage':
                            changeStage(data, ws)
                            break
                        case 'leaveProgress':
                            leaveProgress(data, ws)
                            break
                        case 'likeMessage':
                        case 'removeLikeMessage':
                        case 'dislikeMessage':
                        case 'removeDislikeMessage':
                            changeLikesMessage(data, ws)
                            break
                        case 'getFriendsData':
                            getFriendsData(data, ws)
                            break
                        case 'editGoalInProgress':
                            editGoalInProgress(data, ws)
                            break
                        case 'editAccount':
                            editAccount(data, ws)
                            break
                        case 'deleteAccount':
                            deleteAccount(data, ws)
                            break
                        case 'saveWishlistItem':
                            saveWishlistItem(data, ws)
                            break
                        case 'deleteWishlistItem':
                            deleteWishlistItem(data, ws)
                            break
                        case 'savePerk':
                            savePerk(data, ws)
                            break
                        case 'deletePerk':
                            deletePerk(data, ws)
                            break
                        case 'buyPerk':
                            buyPerk(data, ws)
                            break
                        case 'cancelTransaction':
                            cancelTransaction(data, ws)
                            break
                        case 'confirmTransaction':
                            confirmTransaction(data, ws)
                            break
                        case 'searchFriends':
                            searchFriends(data, ws)
                            break
                        case 'addFriend':
                            addFriend(data, ws)
                            break
                        case 'acceptFriend':
                            acceptFriend(data, ws)
                            break
                        case 'unfriend':
                            unfriend(data, ws)
                            break
                        case 'startProgress':
                            startProgress(data, ws)
                            break
                        case 'saveReward':
                            saveReward(data, ws)
                            break
                        case 'deleteReward':
                            deleteReward(data, ws)
                            break
                        case 'setLastSeenNot':
                            setLastSeenNot(data, ws)
                            break
                        case 'followProgress':
                            followProgress(data, ws)
                            break
                        case 'unfollowProgress':
                            unfollowProgress(data, ws)
                            break
                        case 'followAccount':
                            followAccount(data, ws)
                            break
                        case 'unfollowAccount':
                            unfollowAccount(data, ws)
                            break
                        case 'changeLikesProgress':
                            changeLikesProgress(data, ws)
                            break
                        default:
                            break
                    }
                } catch (rejRes) {
                    console.log(rejRes)
                    sendError(
                        ws,
                        'Your connection with server is overloaded. Please try again later.'
                    )
                }
            })

            ws.on('close', async () => {})
        })

        const interval = setInterval(() => {
            wss.clients.forEach(async ws => {
                if (ws.isAlive === false) {
                    return ws.terminate()
                }
                ws.isAlive = false
                ws.send(
                    JSON.stringify({
                        messageCode: 'heartbeat',
                        versions: ws.resources,
                    })
                )
            })
        }, 30000)
    } catch (ex) {}
}

module.exports = connectSocket
