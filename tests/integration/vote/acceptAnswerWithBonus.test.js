const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const {
    Club,
    Account,
    Question,
    Answer,
    Count,
    Comment,
} = require('../../../src/models')
const value = require('../../../src/config/value')

setupTestDB()

describe('POST /api/vote/accept', () => {
    test('should distribute bonus', async () => {
        const oldClub = await Club.findOne({ name: 'Test club 1' }).lean()
        const clubId = oldClub._id.toString()

        const userStart = await Account.findOne({
            facebookProfile: 'f_0',
        }).lean()

        await Account.updateOne({ _id: userStart._id }, { wallet: 200 })

        await request(app)
            .post('/api/question/create')
            .set('accountId', 'f_0')
            .send({
                clubId,
                name: 'Here we are testing end to end',
                description: 'I want to know how to o it.',
                images: ['test1.jpg', 'test2.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
                bonusCoins: 50,
            })
            .expect(httpStatus.OK)

        const oldQuestion = await Question.findOne({
            name: 'Here we are testing end to end',
        }).lean()
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/question/edit')
            .set('accountId', 'f_0')
            .send({
                resourceId: questionId,
                name: 'Here we are testing end to end',
                description: 'I want to know how to o it.',
                images: ['test1.jpg', 'test2.jpg'],
                tags: ['res1', 'res2', 'res3sdfsfsdfsdfsdfsd'],
                bonusCoins: 50,
            })
            .expect(httpStatus.OK)
        // Question with 95 coins bonus
        // Owner is f_0

        const giveAnswer = async (id, description) => {
            await request(app)
                .post('/api/answer/create')
                .set('accountId', id)
                .send({
                    description,
                    images: ['test2.jpg'],
                    questionId,
                })
                .expect(httpStatus.OK)

            const answer = await Answer.findOne({ description }).lean()
            return [answer, answer._id.toString()]
        }

        const [answer0, answer0Id] = await giveAnswer(
            'f_0',
            'f_0 answer is here'
        )
        const [answer1, answer1Id] = await giveAnswer(
            'f_3',
            'f_1 answer is here'
        )
        const [answer2, answer2Id] = await giveAnswer(
            'f_4',
            'f_2 answer is here'
        )
        const [answer3, answer3Id] = await giveAnswer(
            'f_5',
            'f_3 answer is here'
        )

        const giveComment = async (id, text, resourceId, resourceType) => {
            await request(app)
                .post('/api/comment/create')
                .set('accountId', id)
                .send({
                    text,
                    resourceType,
                    resourceId,
                })
                .expect(httpStatus.OK)

            const comment = await Comment.findOne({ text }).lean()
            return [comment, comment._id.toString()]
        }

        const [comment0, comment0Id] = await giveComment(
            'f_0',
            'f_0 comment is here',
            answer1Id,
            'answer'
        )
        const [comment1, comment1Id] = await giveComment(
            'f_3',
            'f_1 comment is here',
            answer2Id,
            'answer'
        )
        const [comment2, comment2Id] = await giveComment(
            'f_4',
            'f_2 comment is here',
            answer3Id,
            'answer'
        )
        const [comment3, comment3Id] = await giveComment(
            'f_5',
            'f_3 comment is here',
            questionId,
            'question'
        )

        const giveVote = (id, resourceId, type, minus) =>
            request(app)
                .post('/api/vote/vote')
                .set('accountId', id)
                .send({
                    resourceId,
                    type,
                    minus,
                })
                .expect(httpStatus.OK)

        await giveVote('f_0', answer1Id, 'answer')
        await giveVote('f_0', answer2Id, 'answer')
        await giveVote('f_0', answer3Id, 'answer')
        await giveVote('f_0', comment1Id, 'comment')

        await giveVote('f_3', questionId, 'question')
        await giveVote('f_3', comment2Id, 'comment', true)
        await giveVote('f_3', answer2Id, 'answer', true)

        await giveVote('f_4', comment3Id, 'comment')

        await giveVote('f_5', questionId, 'question', true)
        await giveVote('f_5', answer1Id, 'answer')

        await request(app)
            .post('/api/comment/delete')
            .set('accountId', 'f_5')
            .send({
                commentId: comment3Id,
            })
            .expect(httpStatus.OK)

        const question = await Question.findById(questionId).lean()
        expect(question.bonusPaid).toBeFalsy()
        expect(question.bonusCoins).toEqual(95)
        expect(question.bonusPending).toBeTruthy()

        const user0 = await Account.findOne({
            facebookProfile: 'f_0',
        }).lean()
        const user1 = await Account.findOne({
            facebookProfile: 'f_3',
        }).lean()
        const user2 = await Account.findOne({
            facebookProfile: 'f_4',
        }).lean()
        const user3 = await Account.findOne({
            facebookProfile: 'f_5',
        }).lean()

        await request(app)
            .post('/api/vote/accept')
            .set('accountId', 'f_0')
            .send({
                answerId: answer1Id,
            })
            .expect(httpStatus.OK)

        const count = await Count.findById(oldQuestion.count).lean()

        const rep0 = value.plusResource + value.minusResource
        const rep1 =
            2 * value.plusResource + value.plusComment + value.acceptedAnswer
        const rep2 =
            value.plusResource + value.minusResource + value.minusComment
        const rep3 = value.plusResource

        expect(count.reputationDestribution).toMatchObject({
            [user0._id]: rep0,
            [user1._id]: rep1,
            [user2._id]: rep2,
            [user3._id]: rep3,
        })

        const newUser0 = await Account.findOne({
            facebookProfile: 'f_0',
        }).lean()
        const newUser1 = await Account.findOne({
            facebookProfile: 'f_3',
        }).lean()
        const newUser2 = await Account.findOne({
            facebookProfile: 'f_4',
        }).lean()
        const newUser3 = await Account.findOne({
            facebookProfile: 'f_5',
        }).lean()

        const pool = 95 / 2
        const acceptedAnswer = 95 / 2
        const totalRep = rep0 + rep1 + rep2 + rep3
        const price = pool / totalRep

        expect(newUser1.wallet).toEqual(
            user1.wallet + acceptedAnswer + price * rep1
        )
        expect(newUser0.wallet).toEqual(user0.wallet + price * rep0)
        expect(newUser2.wallet).toEqual(user2.wallet + price * rep2)
        expect(newUser3.wallet).toEqual(user3.wallet + price * rep3)
    })
})
