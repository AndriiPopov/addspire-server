const winston = require('winston')
const mongoose = require('mongoose')

module.exports = function() {
    try {
        const db = process.env.websiter_db

        mongoose.connect(db, { poolSize: 50 }).then(() => {
            // User.update({}, { currentAction: 0 }, { multi: true }, function(
            //     err,
            //     numberAffected
            // ) {
            //     console.log(numberAffected)
            // })
            winston.info(`Connected to ${db}`)
        })
    } catch (ex) {}
}
