const httpStatus = require('http-status')
const grades = require('../config/grades')
const value = require('../config/value')
const { Club } = require('../models')
const ApiError = require('./ApiError')

const getGrade = (reputation) => {
    for (let i = 0; i <= 10; i += 1) {
        const gradeName = `grade${i}`
        const grade = grades[gradeName]
        if (grade) {
            if (typeof grade.min === 'undefined' || grade.min <= reputation) {
                if (
                    typeof grade.max === 'undefined' ||
                    reputation < grade.max
                ) {
                    return { grade, name: gradeName }
                }
            }
        }
    }
}

const checkVote = async (reputation, type) => {
    if (reputation.admin) return true
    if (reputation.banned) return false

    switch (type) {
        case 'start': {
            const club = await Club.findById(reputation.club)
                .select('startConversation adminsCount fresh')
                .lean()
                .exec()

            if (!club || (club.adminsCount < value.minAdmins && !club.fresh)) {
                throw new ApiError(httpStatus.CONFLICT, 'Club not active')
            }
            let enoughReputation
            switch (club.startConversation) {
                case 'any':
                    enoughReputation = true
                    break
                case '10':
                    if (reputation.reputation >= 10) {
                        enoughReputation = true
                    }
                    break
                case '100':
                    if (reputation.reputation >= 100) {
                        enoughReputation = true
                    }
                    break
                default:
                    enoughReputation = false
            }
            if (enoughReputation && reputation.reputation >= 0) return true
            break
        }
        case 'create': {
            if (reputation.reputation >= 0) return true
            break
        }
        case 'plus': {
            const { grade } = getGrade(reputation.reputation)

            if (reputation.plusToday < grade.plus) return true
            break
        }
        case 'minus': {
            const { grade } = getGrade(reputation.reputation)
            if (reputation.minusToday < grade.minus) return true
            break
        }
        default:
            return false
    }
}

module.exports.checkVote = checkVote
