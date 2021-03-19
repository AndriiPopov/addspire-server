const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const WebSocket = require('ws')
const { Post } = require('../models/post')
const { Board } = require('../models/board')
const { Structure } = require('../models/structure')
const { Advice } = require('../models/advice')
const { Survey } = require('../models/survey')
const { People } = require('../models/people')
const { Community } = require('../models/community')
const { Place } = require('../models/place')
const { Document } = require('../models/document')

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
            Advice.watch()
        } catch (ex) {}
        try {
            Board.watch()
        } catch (ex) {}
        try {
            Community.watch()
        } catch (ex) {}
        try {
            Document.watch()
        } catch (ex) {}
        try {
            People.watch()
        } catch (ex) {}
        try {
            Place.watch()
        } catch (ex) {}
        try {
            Post.watch()
        } catch (ex) {}
        try {
            Progress.watch()
        } catch (ex) {}
        try {
            Structure.watch()
        } catch (ex) {}
        try {
            Survey.watch()
        } catch (ex) {}

        const accountChangeStream = Account.watch().on('change', data => {
            pushChange(data, 'account')
        })
        const adviceChangeStream = Advice.watch().on('change', data => {
            pushChange(data, 'advice')
        })
        const boardChangeStream = Board.watch().on('change', data => {
            pushChange(data, 'board')
        })
        const communityChangeStream = Community.watch().on('change', data => {
            pushChange(data, 'community')
        })
        const documentChangeStream = Document.watch().on('change', data => {
            pushChange(data, 'document')
        })
        const peopleChangeStream = People.watch().on('change', data => {
            pushChange(data, 'people')
        })
        const placeChangeStream = Place.watch().on('change', data => {
            pushChange(data, 'place')
        })
        const postChangeStream = Post.watch().on('change', data => {
            pushChange(data, 'post')
        })
        const progressChangeStream = Progress.watch().on('change', data => {
            pushChange(data, 'progress')
        })
        const structureChangeStream = Structure.watch().on('change', data => {
            pushChange(data, 'structure')
        })
        const surveyChangeStream = Survey.watch().on('change', data => {
            pushChange(data, 'survey')
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
        resumeStream(adviceChangeStream, true)
        resumeStream(communityChangeStream, true)
        resumeStream(boardChangeStream, true)
        resumeStream(documentChangeStream, true)
        resumeStream(peopleChangeStream, true)
        resumeStream(placeChangeStream, true)
        resumeStream(postChangeStream, true)
        resumeStream(progressChangeStream, true)
        resumeStream(structureChangeStream, true)
        resumeStream(surveyChangeStream, true)
    } catch (ex) {}
}
