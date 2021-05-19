const { sendUpdatedData } = require('../controllers/document.controller')
const {
    Account,
    Comment,
    Club,
    Plugin,
    Reputation,
    Resource,
} = require('../models')

module.exports.pushChanges = () => {
    try {
        const pushChange = (data, type) => {
            try {
                if (data.operationType === 'update') {
                    sendUpdatedData(data, [type, `${type}D`])
                }
            } catch (ex) {
                console.log(ex)
            }
        }
        const resumeTokens = {}
        const watchCollection = (coll, name) => {
            coll.watch({ resumeAfter: resumeTokens[name] })
                .on('change', (data) => {
                    resumeTokens[name] = data._id
                    pushChange(data, name)
                })
                .on('error', (err) => {
                    console.log(err)
                    watchCollection(coll, name)
                })
        }

        watchCollection(Account, 'account')
        watchCollection(Comment, 'comment')
        watchCollection(Club, 'club')
        watchCollection(Plugin, 'plugin')
        watchCollection(Reputation, 'reputation')
        watchCollection(Resource, 'resource')
    } catch (ex) {
        console.log(ex)
    }
}
