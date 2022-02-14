const request = require('supertest')
const httpStatus = require('http-status')
const mongoose = require('mongoose')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Count } = require('../../../src/models')

setupTestDB()

describe('POST /api/count/current', () => {
    test('should return 201 and successfully find counts', async () => {
        const res0 = await request(app)
            .post('/api/count/current')
            .send({
                ids: [],
            })
            .expect(httpStatus.OK)

        expect(res0.body).toEqual([])

        const questionId0 = mongoose.Types.ObjectId()
        await Count.create({
            total: 10,

            question: questionId0,
        })
        const questionId1 = mongoose.Types.ObjectId()
        await Count.create({
            total: 20,

            question: questionId1,
        })

        const res1 = await request(app)
            .post('/api/count/current')
            .send({
                ids: [questionId0],
            })
            .expect(httpStatus.OK)

        expect(res1.body.length).toEqual(1)
        expect(res1.body[0]).toMatchObject({ total: 10 })

        const questionId2 = mongoose.Types.ObjectId()
        const res2 = await request(app)
            .post('/api/count/current')
            .send({
                ids: [questionId0, questionId2, questionId1],
            })
            .expect(httpStatus.OK)

        expect(res2.body.length).toEqual(2)
        expect(res2.body[0]).toMatchObject({ total: 10 })
        expect(res2.body[1]).toMatchObject({ total: 20 })
    })

    test('should return 400 error if  validation fails', async () => {
        await request(app)
            .post('/api/count/current')
            .send({
                ids: ['sadsad'],
            })
            .expect(httpStatus.BAD_REQUEST)
        await request(app)
            .post('/api/count/current')
            .send()
            .expect(httpStatus.BAD_REQUEST)
    })
})
