const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { tagService } = require('../../../src/services')

setupTestDB()

describe('GET /api/tag/findTags', () => {
    test('should xrete tags, find tag and return an array of tags sorted by length', async () => {
        await tagService.saveTags([
            'MYVERYLONGTag',
            'myFirstTag',
            'mySecondTag',
            'strange',
            'veryStrange',
            'dullTag1',
            'dullTag22',
            'dullTag333',
            'dullTag4444',
            'dullTag55555',
            'dullTag666666',
            'dullTag7777777',
            'dullTag88888888',
            'dullTag999999999',
        ])

        let res = await request(app)
            .get('/api/tag/find-tags')
            .query({ tag: 'my' })
            .expect(httpStatus.OK)

        let { tags } = res.body
        expect(tags).toEqual(['myFirstTag', 'mySecondTag', 'MYVERYLONGTag'])

        res = await request(app)
            .get('/api/tag/find-tags')
            .query({ tag: 'very' })
            .expect(httpStatus.OK)

        tags = res.body.tags
        expect(tags).toEqual(['veryStrange', 'MYVERYLONGTag'])

        await request(app)
            .get('/api/tag/find-tags')
            .query({ tag: '' })
            .expect(httpStatus.BAD_REQUEST)

        res = await request(app)
            .get('/api/tag/find-tags')
            .query({ tag: 'unknown' })
            .expect(httpStatus.OK)

        tags = res.body.tags
        expect(tags).toEqual([])
    })
})
