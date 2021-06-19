const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/follow', () => {
    test('should return 200 and successfully follow another account, return 400 if follow again, return 200 if unfollow and 400 on unfollow again', async () => {
        const oldFollower = await Account.findOne({ facebookProfile: 'f_0' })
        const followerId = oldFollower._id.toString()

        const oldFollowing = await Account.findOne({ facebookProfile: 'f_1' })
        const followingId = oldFollowing._id.toString()

        await request(app)
            .post('/api/account/follow')
            .set('accountId', 'f_0')
            .send({
                type: 'account',
                resourceId: followingId,
            })
            .expect(httpStatus.OK)

        const follower = await Account.findById(followerId).lean()
        expect(follower).not.toBeNull()

        const following = await Account.findById(followingId).lean()
        expect(following).not.toBeNull()

        expect(oldFollower.following).not.toContain(followingId)
        expect(follower.following).toContain(followingId)

        expect(oldFollowing.followers).not.toContain(followerId)
        expect(following.followers).toContain(followerId)

        expect(following.followersCount - oldFollowing.followersCount).toEqual(
            1
        )

        await request(app)
            .post('/api/account/follow')
            .set('accountId', 'f_0')
            .send({
                type: 'account',
                resourceId: followingId,
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', 'f_0')
            .send({
                type: 'account',
                resourceId: followingId,
            })
            .expect(httpStatus.OK)

        const newFollower = await Account.findById(followerId).lean()
        expect(newFollower).not.toBeNull()

        const newFollowing = await Account.findById(followingId).lean()
        expect(newFollowing).not.toBeNull()

        expect(follower.following).toContain(followingId)
        expect(newFollower.following).not.toContain(followingId)

        expect(following.followers).toContain(followerId)
        expect(newFollowing.followers).not.toContain(followerId)

        expect(following.followersCount - newFollowing.followersCount).toEqual(
            1
        )

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', 'f_0')
            .send({
                type: 'account',
                resourceId: followingId,
            })
            .expect(httpStatus.BAD_REQUEST)
    })

    test('should return 400 if follow and unfollow self', async () => {
        const oldFollower = await Account.findOne({ facebookProfile: 'f_0' })
        const followerId = oldFollower._id.toString()

        await request(app)
            .post('/api/account/follow')
            .set('accountId', 'f_0')
            .send({
                type: 'account',
                resourceId: followerId,
            })
            .expect(httpStatus.BAD_REQUEST)

        const follower = await Account.findById(followerId).lean()
        expect(follower).not.toBeNull()

        expect(oldFollower.following).not.toContain(followerId)
        expect(follower.following).not.toContain(followerId)

        expect(follower.followersCount).toEqual(oldFollower.followersCount)

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', 'f_0')
            .send({
                type: 'account',
                resourceId: followerId,
            })
            .expect(httpStatus.BAD_REQUEST)

        const newFollower = await Account.findById(followerId).lean()
        expect(newFollower).not.toBeNull()

        expect(newFollower.followersCount).toEqual(follower.followersCount)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldFollowing = await Account.findOne({ facebookProfile: 'f_1' })
        const followingId = oldFollowing._id.toString()

        await request(app)
            .post('/api/account/follow')
            .set('accountId', 'f_0')
            .send({
                type: 'acdfgfdgcount',
                resourceId: followingId,
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', 'f_0')
            .send({
                type: 'account',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
