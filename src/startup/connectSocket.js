const { auth } = require('../wsActions/auth')
const {
    requestProgress,
    changeStage,
    getFriendsData,
    editProgress,
    leaveProgress,

    startProgress,
    changeLikesProgress,
    // deleteProgress,
    deleteRewardFromProgress,
    addRewardToProgress,
} = require('../wsActions/progress')

const {
    saveReward,
    deleteReward,
    changeLikesReward,
} = require('../wsActions/reward')

const {
    sendMessage,
    changeLikesMessage,
    addPost,
    editPost,
} = require('../wsActions/post')
const {
    editAccount,
    deleteAccount,
    followAccount,
    unfollowAccount,
    followProgress,
    unfollowProgress,
    addRecentProgress,
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
const { promisify } = require('util')

const connectSocket = server => {
    try {
        const wss = new Server({ server })

        setTimeout(() => pushChanges(wss), 4000)

        const client = require('redis').createClient(
            process.env.REDIS_URL || ''
        )
        const scan = promisify(client.scan).bind(client)
        const scanAll = async () => {
            const found = []
            let cursor = '0'

            do {
                const reply = await scan(cursor)

                cursor = reply[0]
                found.push(...reply[1])
            } while (cursor !== '0')

            return found
        }
        wss.on('connection', function connection(ws) {
            ws.resources = {
                user: {},
                account: {},
                progress: {},
                post: {},
                reward: {},
                transactionData: {},
                friendData: {},
                progressData: {},
                postData: {},
                rewardData: {},
            }
            ws.isAlive = true
            ws.createdTime = Date.now()

            ws.on('message', async message => {
                try {
                    const data = JSON.parse(message)
                    switch (data.messageCode) {
                        case 'heartbeat':
                            heartbeat(ws, data, client)
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
                        case 'editProgress':
                            editProgress(data, ws)
                            break
                        case 'editAccount':
                            editAccount(data, ws)
                            break
                        case 'deleteAccount':
                            deleteAccount(data, ws)
                            break
                        case 'addRecentProgress':
                            addRecentProgress(data, ws)
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
                        case 'changeLikesReward':
                            changeLikesReward(data, ws)
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
                        case 'deleteRewardFromProgress':
                            deleteRewardFromProgress(data, ws)
                            break
                        case 'addRewardToProgress':
                            addRewardToProgress(data, ws)
                            break
                        case 'currentAccount':
                            ws.account = data.id
                            client.set(data.id, true, 'EX', 40)
                            break
                        // case 'deleteProgress':
                        //     deleteProgress(data, ws)
                        //     break
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
            const onlineUsers = scanAll()
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
    } catch (ex) {}
}

module.exports = connectSocket
