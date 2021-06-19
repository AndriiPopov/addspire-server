const {
    Account,
    Comment,
    Club,
    Plugin,
    Reputation,
    Resource,
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
    watchCollection(Plugin, 'plugin')
    watchCollection(Reputation, 'reputation')
    watchCollection(Resource, 'resource')
}
