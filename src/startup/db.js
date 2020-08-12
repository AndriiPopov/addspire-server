const winston = require('winston')
const mongoose = require('mongoose')
const { System } = require('../models/system')

module.exports = function() {
    try {
        const db = process.env.websiter_db
        mongoose.set('useFindAndModify', false)

        mongoose.connect(db, { poolSize: 50 }).then(async () => {
            // User.update({}, { currentAction: 0 }, { multi: true }, function(
            //     err,
            //     numberAffected
            // ) {
            //     console.log(numberAffected)
            // })
            winston.info(`Connected to ${db}`)
            let system = await System.findOne({ name: 'system' })
            if (!system) {
                system = new System({
                    currentId: 0,
                })
                await system.save()
            }
        })
    } catch (ex) {}
}
