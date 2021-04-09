const winston = require('winston')
const mongoose = require('mongoose')
const { System } = require('../models/system')

module.exports = function() {
    try {
        const db = process.env.websiter_db
        mongoose.set('useFindAndModify', false)
        mongoose.connect(db, { poolSize: 50 }).then(async () => {
            // Advice.updateMany(
            //     {},
            //     { moderated: true },
            //     { multi: true },
            //     function(err, numberAffected) {
            //         console.log(numberAffected)
            //     }
            // )
            // Board.updateMany({}, { moderated: true }, { multi: true }, function(
            //     err,
            //     numberAffected
            // ) {
            //     console.log(numberAffected)
            // })
            // Place.updateMany({}, { moderated: true }, { multi: true }, function(
            //     err,
            //     numberAffected
            // ) {
            //     console.log(numberAffected)
            // })
            // Community.updateMany(
            //     {},
            //     { moderated: true },
            //     { multi: true },
            //     function(err, numberAffected) {
            //         console.log(numberAffected)
            //     }
            // )
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
                    currentImgId: 0,
                })
                await system.save()
            }
        })
    } catch (ex) {}
}
