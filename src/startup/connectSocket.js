const { auth } = require('../wsActions/auth')
const {
    requestProgress,
    getFriendsData,
    editProgress,
    startProgress,
    deleteRewardFromProgress,
    addRewardToProgress,
    deleteActivityFromProgress,
    addActivityToProgress,
    saveRewardInProgress,
    deleteRewardInProgress,
    sendReward,
} = require('../wsActions/progress')

const {
    saveResource,
    deleteResource,
    changeLikesResource,
    leaveResource,
    changeResourceStatus,
} = require('../wsActions/resource')

const {
    saveReward,
    deleteReward,
    changeLikesReward,
} = require('../wsActions/reward')

const {
    saveActivity,
    deleteActivity,
    changeLikesActivity,
    changeStage,
} = require('../wsActions/activity')

const {
    sendMessage,
    changeLikesMessage,
    addPost,
    editPost,
    deletePost,
    // deleteMessage,
} = require('../wsActions/post')
const {
    editAccount,
    deleteAccount,
    followAccount,
    unfollowAccount,
    followResource,
    unfollowResource,
    addRecent,
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
    shareWithFriends,
} = require('../wsActions/friends')
const {
    cancelTransaction,
    confirmTransaction,
    deleteTransaction,
} = require('../wsActions/transactions')

const { pushChanges } = require('../wsActions/pushChanges')
const { heartbeat } = require('../wsActions/heartbeat')
const { requestResource } = require('../wsActions/requestResource')
const { Server } = require('ws')
const { sendError } = require('../wsActions/confirm')
const { scanAll, redisClient: client } = require('./redis')

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
                reward: {},
                activity: {},
                transactionData: {},
                friendData: {},
                progressData: {},
                postData: {},
                activityData: {},
            }
            ws.isAlive = true
            ws.createdTime = Date.now()

            ws.on('message', async message => {
                try {
                    const data = JSON.parse(message)
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
                        case 'editPost':
                            editPost(data, ws)
                            break
                        case 'deletePost':
                            deletePost(data, ws)
                            break
                        // case 'deleteMessage':
                        //     deleteMessage(data, ws)
                        //     break
                        case 'changeStage':
                            changeStage(data, ws)
                            break
                        case 'leaveResource':
                            leaveResource(data, ws)
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
                        case 'shareWithFriends':
                            shareWithFriends(data, ws)
                            break

                        case 'setLastSeenNot':
                            setLastSeenNot(data, ws)
                            break
                        case 'followResource':
                            followResource(data, ws)
                            break
                        case 'unfollowResource':
                            unfollowResource(data, ws)
                            break
                        case 'followAccount':
                            followAccount(data, ws)
                            break
                        case 'unfollowAccount':
                            unfollowAccount(data, ws)
                            break
                        case 'changeLikesResource':
                            changeLikesResource(data, ws)
                            break
                        case 'deleteRewardFromProgress':
                            deleteRewardFromProgress(data, ws)
                            break
                        case 'addRewardToProgress':
                            addRewardToProgress(data, ws)
                            break
                        case 'deleteActivityFromProgress':
                            deleteActivityFromProgress(data, ws)
                            break
                        case 'addActivityToProgress':
                            addActivityToProgress(data, ws)
                            break
                        case 'saveRewardInProgress':
                            saveRewardInProgress(data, ws)
                            break
                        case 'deleteRewardInProgress':
                            deleteRewardInProgress(data, ws)
                            break
                        case 'sendReward':
                            sendReward(data, ws)
                            break
                        case 'currentAccount':
                            ws.account = data.id
                            client.set(data.id, true, 'EX', 40)
                            break
                        case 'saveResource':
                            saveResource(data, ws)
                            break
                        case 'deleteResource':
                            deleteResource(data, ws)
                            break
                        case 'deleteTransaction':
                            deleteTransaction(data, ws)
                            break
                        case 'addRecent':
                            addRecent(data, ws)
                            break
                        case 'changeResourceStatus':
                            changeResourceStatus(data, ws)
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

        const interval = setInterval(async () => {
            const onlineUsers = await scanAll()
            wss.clients.forEach(async ws => {
                if (ws.isAlive === false) {
                    return ws.terminate()
                }
                ws.isAlive = false
                const clientOnlineUsers = []
                for (let key in ws.resources.account) {
                    if (onlineUsers.has(key)) clientOnlineUsers.push(key)
                }
                for (let key in ws.resources.friendData) {
                    if (onlineUsers.has(key)) clientOnlineUsers.push(key)
                }
                ws.send(
                    JSON.stringify({
                        messageCode: 'heartbeat',
                        versions: ws.resources,
                        onlineUsers: clientOnlineUsers,
                    })
                )
            })
        }, 30000)
    } catch (ex) {
        console.log(ex)
    }
}

module.exports = connectSocket
