const winston = require('winston')
const mongoose = require('mongoose')
const { System } = require('../models/system')
const { updateStagesAuto } = require('../utils/updateStages')
// const { Account } = require('../models/account')

module.exports = function() {
    try {
        const db = process.env.websiter_db
        mongoose.set('useFindAndModify', false)
        mongoose.connect(db, { poolSize: 100 }).then(async () => {
            // Account.updateMany({}, { tokens: [] }, { multi: true }, function(
            //     err,
            //     numberAffected
            // ) {
            //     console.log(numberAffected)
            // })
            // System.updateMany(
            //     {},
            //     { notifications: [] },
            //     { multi: true },
            //     function(err, numberAffected) {
            //         console.log(numberAffected)
            //     }
            // )
            winston.info(`Connected to ${db}`)
            let system = await System.findOne({ name: 'system' })
            if (!system) {
                system = new System({
                    currentId: 0,
                })
                await system.save()
            }
            updateStagesAuto()
        })
    } catch (ex) {}
}
