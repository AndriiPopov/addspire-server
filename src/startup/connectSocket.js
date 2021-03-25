const { auth } = require('../wsActions/auth')

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
    follow,
    unfollow,
    like,
    unlike,

    // addRecent,
    // saveStructure,
    addImage,
    deleteImage,
    setAvatar,
    saveAboutUser,
    markSeenNots,
} = require('../wsActions/account')

const { setLastSeenNot } = require('../wsActions/dashboard')
const { addAdmin, deleteAdmin, setSAdmin } = require('../wsActions/admin')
const {
    addSuggestedChange,
    reviewResult,
    createResource,
} = require('../wsActions/resources')
const {
    createCommunity,
    becomeMember,
    leave,
} = require('../wsActions/community')

const {
    setProgressStepStatus,
    startAdvice,
    changeProgressStatus,
    changeStage,
    changeProgressStepRepeat,
    changeProgressStepNote,
} = require('../wsActions/progress')
const { searchFriends, shareWithFriends } = require('../wsActions/friends')

const { pushChanges } = require('../wsActions/pushChanges')
const { heartbeat } = require('../wsActions/heartbeat')
const { requestResource } = require('../wsActions/requestResource')
const { Server } = require('ws')
const { sendError } = require('../wsActions/confirm')
const { scanAll } = require('./redis')
const resources = require('../constants/resources')
const {
    editBoardAdvices,
    editBoard,
    addResourceToBoard,
    deleteResourceFromBoard,
    deleteBoard,
    saveBoard,
} = require('../wsActions/board')

const connectSocket = server => {
    try {
        const wss = new Server({ server })

        setTimeout(() => pushChanges(wss), 4000)

        wss.on('connection', function connection(ws) {
            ws.resources = {}
            for (let r of resources) ws.resources[r] = {}

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
                        case 'markSeenNots':
                            markSeenNots(data, ws)
                            break
                        case 'requestResource':
                            requestResource(data, ws)
                            break
                        case 'becomeMember':
                            becomeMember(data, ws)
                            break
                        case 'leave':
                            leave(data, ws)
                            break
                        case 'addSuggestedChange':
                            addSuggestedChange(data, ws)
                            break
                        case 'reviewResult':
                            reviewResult(data, ws)
                            break
                        case 'createNewBoard':
                            createNewBoard(data, ws)
                            break
                        case 'createResource':
                            createResource(data, ws)
                            break
                        case 'editBoard':
                            editBoard(data, ws)
                            break
                        case 'saveBoard':
                            saveBoard(data, ws)
                            break
                        case 'deleteBoard':
                            deleteBoard(data, ws)
                            break
                        case 'editBoardAdvices':
                            editBoardAdvices(data, ws)
                            break
                        case 'addResourceToBoard':
                            addResourceToBoard(data, ws)
                            break
                        case 'deleteResourceFromBoard':
                            deleteResourceFromBoard(data, ws)
                            break
                        case 'editVersion':
                            editVersion(data, ws)
                            break
                        case 'createCommunity':
                            createCommunity(data, ws)
                            break
                        case 'createPeople':
                            createPeople(data, ws)
                            break
                        case 'createNewAdvice':
                            createNewAdvice(data, ws)
                            break
                        case 'startAdvice':
                            startAdvice(data, ws)
                            break
                        case 'setProgressStepStatus':
                            setProgressStepStatus(data, ws)
                            break
                        case 'changeProgressStatus':
                            changeProgressStatus(data, ws)
                            break
                        case 'changeStage':
                            changeStage(data, ws)
                            break
                        case 'changeProgressStepRepeat':
                            changeProgressStepRepeat(data, ws)
                            break
                        case 'changeProgressStepNote':
                            changeProgressStepNote(data, ws)
                            break
                        case 'setSAdmin':
                            setSAdmin(data, ws)
                            break
                        case 'addAdmin':
                            addAdmin(data, ws)
                            break
                        case 'deleteAdmin':
                            deleteAdmin(data, ws)
                            break
                        case 'reviewVersion':
                            reviewVersion(data, ws)
                            break
                        case 'changeVersion':
                            changeVersion(data, ws)
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
                        case 'addImage':
                            addImage(data, ws)
                            break
                        case 'deleteImage':
                            deleteImage(data, ws)
                            break
                        case 'setAvatar':
                            setAvatar(data, ws)
                            break
                        case 'saveAboutUser':
                            saveAboutUser(data, ws)
                            break
                        case 'deleteAccount':
                            deleteAccount(data, ws)
                            break

                        case 'searchFriends':
                            searchFriends(data, ws)
                            break

                        case 'shareWithFriends':
                            shareWithFriends(data, ws)
                            break

                        // case 'setLastSeenNot':
                        //     setLastSeenNot(data, ws)
                        //     break

                        case 'follow':
                            follow(data, ws)
                            break
                        case 'unfollow':
                            unfollow(data, ws)
                            break
                        case 'like':
                            like(data, ws)
                            break
                        case 'unlike':
                            unlike(data, ws)
                            break

                        // case 'addRecent':
                        //     addRecent(data, ws)
                        //     break
                        // case 'changeResourceStatus':
                        //     changeResourceStatus(data, ws)
                        //     break
                        // case 'saveStructure':
                        //     saveStructure(data, ws)
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
                for (let key in ws.resources.accountD) {
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
