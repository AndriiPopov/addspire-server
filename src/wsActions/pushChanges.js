const { Progress } = require('../models/progress')
const WebSocket = require('ws')
const { sendError } = require('./error')

module.exports.pushChanges = wss => {
    try {
        const pushChange = data => {
            try {
                if (
                    data.operationType === 'update' ||
                    data.operationType === 'delete'
                ) {
                    wss.clients.forEach(client => {
                        if (
                            client.readyState === WebSocket.OPEN &&
                            client.progressId === data.fullDocument._id
                        ) {
                            client.send(
                                JSON.stringify({
                                    messageCode: data.operationType,
                                    progressId: data.documentKey._id,
                                    progress: data.fullDocument,
                                })
                            )
                        }
                    })
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
            Progress.watch()
        } catch (ex) {}
        Progress.watch(pipe, {
            fullDocument: 'updateLookup',
        }).on('change', data => {
            pushChange(data)
        })
    } catch (ex) {}
}
