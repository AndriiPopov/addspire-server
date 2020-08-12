const { User } = require('../models/user')
const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const { Transaction } = require('../models/transaction')
const WebSocket = require('ws')
const { Post } = require('../models/post')
const { Group } = require('../models/group')

module.exports.pushChanges = wss => {
    try {
        const pushChange = (data, type) => {
            try {
                if (data.operationType === 'update') {
                    const sendData = keys => {
                        for (let client of wss.clients) {
                            for (let key of keys) {
                                // if (
                                //     ![
                                //         'friendData',
                                //         'progressData',
                                //         'postData',
                                //         'groupData',
                                //     ].includes(key) ||
                                //     !data.updateDescription.updatedFields
                                //         .notifications
                                // ) {
                                // console.log(client.resources)
                                // console.log(key)
                                if (
                                    typeof client.resources[key][
                                        data.documentKey._id.toString()
                                    ] !== 'undefined'
                                ) {
                                    if (client.readyState === WebSocket.OPEN) {
                                        // console.log('KEY')
                                        // console.log(key)
                                        // console.log(data)
                                        client.send(
                                            JSON.stringify({
                                                messageCode: 'updateResource',
                                                code: key,
                                                id: data.documentKey._id.toString(),
                                                update: data.updateDescription,
                                            })
                                        )
                                        if (
                                            data.updateDescription &&
                                            data.updateDescription
                                                .updatedFields &&
                                            data.updateDescription.updatedFields
                                                .__v
                                        )
                                            client.resources[key][
                                                data.documentKey._id.toString()
                                            ] =
                                                data.updateDescription.updatedFields.__v
                                    }
                                }
                                // }
                            }
                        }
                    }
                    if (type === 'user') {
                        sendData(['user'])
                    } else if (type === 'account') {
                        sendData(['account', 'friendData'])
                    } else if (type === 'transactions') {
                        sendData(['transactionData'])
                    } else if (type === 'progress') {
                        sendData(['progress', 'progressData'])
                    } else if (type === 'post') {
                        sendData(['post', 'postData'])
                    } else if (type === 'group') {
                        sendData(['group', 'groupData'])
                    }
                }
            } catch (ex) {}
        }
        const pipe = [
            {
                $project: {
                    'fullDocument.patch': 1,
                    'fullDocument.__v': 1,
                    'fullDocument._id': 1,
                    documentKey: 1,
                    operationType: 1,
                },
            },
        ]
        try {
            User.watch()
        } catch (ex) {}
        try {
            Account.watch()
        } catch (ex) {}
        try {
            Progress.watch()
        } catch (ex) {}
        try {
            Transaction.watch()
        } catch (ex) {}

        const userChangeStream = User.watch().on('change', data => {
            pushChange(data, 'user')
        })
        const progressChangeStream = Progress.watch().on('change', data => {
            pushChange(data, 'progress')
        })
        const accountChangeStream = Account.watch().on('change', data => {
            pushChange(data, 'account')
        })
        const transactionChangeStream = Transaction.watch().on(
            'change',
            data => {
                pushChange(data, 'transaction')
            }
        )
        const postChangeStream = Post.watch().on('change', data => {
            pushChange(data, 'post')
        })
        const groupChangeStream = Group.watch().on('change', data => {
            pushChange(data, 'group')
        })

        function resumeStream(changeStreamCursor, forceResume = false) {
            let resumeToken
            while (!changeStreamCursor.isExhausted()) {
                if (changeStreamCursor.hasNext()) {
                    change = changeStreamCursor.next()
                    print(JSON.stringify(change))
                    resumeToken = change._id
                    if (forceResume === true) {
                        print('\r\nSimulating app failure for 10 seconds...')
                        sleepFor(10000)
                        changeStreamCursor.close()
                        const newChangeStreamCursor = collection.watch([], {
                            resumeAfter: resumeToken,
                        })
                        print(
                            '\r\nResuming change stream with token ' +
                                JSON.stringify(resumeToken) +
                                '\r\n'
                        )
                        resumeStream(newChangeStreamCursor)
                    }
                }
            }
            resumeStream(changeStreamCursor, forceResume)
        }

        resumeStream(userChangeStream, true)
        resumeStream(progressChangeStream, true)
        resumeStream(accountChangeStream, true)
        resumeStream(transactionChangeStream, true)
        resumeStream(postChangeStream, true)
        resumeStream(groupChangeStream, true)
    } catch (ex) {}
}
