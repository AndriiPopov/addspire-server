const {
    Account,
    Comment,
    Club,
    Reputation,
    Question,
    Answer,
    ImageData,
} = require('../models')
const { sendUpdatedData } = require('./document.service')

module.exports.pushChanges = () => {
    const pushChange = (data, type) => {
        if (data.operationType === 'update') {
            sendUpdatedData(data, [type])
        }
    }
    const resumeTokens = {}
    const watchCollection = (coll, name) => {
        coll.watch({ resumeAfter: resumeTokens[name] })
            .on('change', (data) => {
                resumeTokens[name] = data._id
                pushChange(data, name)
            })
            .on('error', () => {
                watchCollection(coll, name)
            })
    }

    watchCollection(Account, 'account')
    watchCollection(Comment, 'comment')
    watchCollection(Club, 'club')
    watchCollection(Reputation, 'reputation')
    watchCollection(Question, 'question')
    watchCollection(Answer, 'answer')
    watchCollection(ImageData, 'imageData')
}
