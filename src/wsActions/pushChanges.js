const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const WebSocket = require('ws')
const { Post } = require('../models/post')
const { Board } = require('../models/board')
const { Structure } = require('../models/structure')
const { Version } = require('../models/version')
const { Advice } = require('../models/advice')
const { Step } = require('../models/step')
const { ProgressStep } = require('../models/progressStep')

module.exports.pushChanges = wss => {
    try {
        const pushChange = (data, type) => {
            try {
                if (data.operationType === 'update') {
                    const sendData = keys => {
                        for (let client of wss.clients) {
                            for (let key of keys) {
                                if (
                                    typeof client.resources[key][
                                        data.documentKey._id.toString()
                                    ] !== 'undefined'
                                ) {
                                    if (client.readyState === WebSocket.OPEN) {
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
                    sendData([type, type + 'D'])
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
            Account.watch()
        } catch (ex) {}
        try {
            Board.watch()
        } catch (ex) {}
        try {
            Advice.watch()
        } catch (ex) {}
        try {
            Post.watch()
        } catch (ex) {}
        try {
            Progress.watch()
        } catch (ex) {}
        try {
            ProgressStep.watch()
        } catch (ex) {}
        try {
            Step.watch()
        } catch (ex) {}
        try {
            Structure.watch()
        } catch (ex) {}
        try {
            Version.watch()
        } catch (ex) {}

        const accountChangeStream = Account.watch().on('change', data => {
            pushChange(data, 'account')
        })
        const boardChangeStream = Board.watch().on('change', data => {
            pushChange(data, 'board')
        })
        const adviceChangeStream = Advice.watch().on('change', data => {
            pushChange(data, 'advice')
        })
        const postChangeStream = Post.watch().on('change', data => {
            pushChange(data, 'post')
        })
        const progressChangeStream = Progress.watch().on('change', data => {
            pushChange(data, 'progress')
        })
        const progressStepChangeStream = ProgressStep.watch().on(
            'change',
            data => {
                pushChange(data, 'progressStep')
            }
        )
        const stepChangeStream = Step.watch().on('change', data => {
            pushChange(data, 'step')
        })
        const structureChangeStream = Structure.watch().on('change', data => {
            pushChange(data, 'structure')
        })
        const versionChangeStream = Version.watch().on('change', data => {
            pushChange(data, 'version')
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

        resumeStream(accountChangeStream, true)
        resumeStream(boardChangeStream, true)
        resumeStream(adviceChangeStream, true)
        resumeStream(postChangeStream, true)
        resumeStream(progressChangeStream, true)
        resumeStream(progressStepChangeStream, true)
        resumeStream(stepChangeStream, true)
        resumeStream(structureChangeStream, true)
        resumeStream(versionChangeStream, true)
    } catch (ex) {}
}
