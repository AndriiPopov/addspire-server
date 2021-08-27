const setupTestDB = require('../utils/setupTestDB')
const getUserIds = require('./getUserIds')
const createClubs = require('./createClubs')
const addresidents = require('./addresidents')
const addQuestionAnswersComments = require('./addQuestionAnswersComments')

setupTestDB()

describe('POST /api/account/ban', () => {
    test('should mark feed as seen', async () => {
        const testData = {}

        // Get 12 users
        await getUserIds(testData)
        // Create 2 clubs
        await createClubs(testData)
        // Add 2 residents to club 0 and 3 residents to club 1
        await addresidents(testData)
        // Add 2 and 3 questions in clubs
        await addQuestionAnswersComments(testData)
    })
})
