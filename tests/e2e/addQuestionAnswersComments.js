const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../src/app')
const { Question } = require('../../src/models')

const createQuestion = async (id, clubId, name) =>
    request(app)
        .post('/api/question/create')
        .set('accountId', `${id}`)
        .send({
            clubId,
            name,
            description: 'I want to know how to o it.',
            images: ['test1.jpg', 'test2.jpg'],
            tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
        })
        .expect(httpStatus.OK)

const createAnswer = async (id, questionId, description) =>
    request(app)
        .post('/api/answer/create')
        .set('accountId', `${id}`)
        .send({
            description,
            images: ['test2.jpg'],
            questionId,
            bookmark: true,
        })
        .expect(httpStatus.OK)

module.exports = async (testData) => {
    await createQuestion('0', testData.club0_Id, 'How to grow a flower?')
    await createQuestion('1', testData.club0_Id, 'How to grow a tree?')
    await createQuestion('4', testData.club0_Id, 'How to grow a bush?')

    const question = await Question.findOne({
        name: 'How to grow a flower?',
    }).lean()
    const questionId = question._id

    await createQuestion('5', testData.club1_Id, 'How to grow a dog?')
    await createQuestion('6', testData.club1_Id, 'How to grow a cat?')
    await createQuestion('10', testData.club1_Id, 'How to grow a fish?')
}
