const request = require('supertest')
const httpStatus = require('http-status')
const app = require('../../../src/app')
const setupTestDB = require('../../utils/setupTestDB')
const { Account, Reputation, Club, Question } = require('../../../src/models')

setupTestDB()

describe('POST /api/account/follow', () => {
    test('should return 200 and successfully follow reputation, return 400 if follow again, return 200 if unfollow and 400 on unfollow again', async () => {
        const oldFollower = await Account.findOne({ facebookProfile: '1' })
        const followerId = oldFollower._id.toString()

        const oldReputation = await Reputation.findOne({
            owner: { $ne: followerId },
        })
        const reputationId = oldReputation._id.toString()

        await request(app)
            .post('/api/account/follow')
            .set('accountId', '1')
            .send({
                type: 'reputation',
                resourceId: reputationId,
            })
            .expect(httpStatus.OK)

        const follower = await Account.findById(followerId).lean()
        const following = await Reputation.findById(reputationId).lean()

        expect(oldFollower.following).not.toContain(reputationId)
        expect(follower.following).toContain(reputationId)

        expect(oldReputation.followers).not.toContain(followerId)
        expect(following.followers).toContain(followerId)

        expect(following.followersCount - oldReputation.followersCount).toEqual(
            1
        )

        await request(app)
            .post('/api/account/follow')
            .set('accountId', '1')
            .send({
                type: 'reputation',
                resourceId: reputationId,
            })
            .expect(httpStatus.CONFLICT)

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', '1')
            .send({
                type: 'reputation',
                resourceId: reputationId,
            })
            .expect(httpStatus.OK)

        const newFollower = await Account.findById(followerId).lean()
        const newFollowing = await Reputation.findById(reputationId).lean()

        expect(follower.following).toContain(reputationId)
        expect(newFollower.following).not.toContain(reputationId)

        expect(following.followers).toContain(followerId)
        expect(newFollowing.followers).not.toContain(followerId)

        expect(following.followersCount - newFollowing.followersCount).toEqual(
            1
        )

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', '1')
            .send({
                type: 'reputation',
                resourceId: reputationId,
            })
            .expect(httpStatus.CONFLICT)
    })

    test('should return 200 and successfully follow club, return 400 if follow again, return 200 if unfollow and 400 on unfollow again', async () => {
        const oldFollower = await Account.findOne({ facebookProfile: '1' })
        const followerId = oldFollower._id.toString()

        const oldClub = await Club.findOne({
            owner: { $ne: followerId },
        })
        const clubId = oldClub._id.toString()

        const oldReputation = await Reputation.findOne({
            club: clubId,
            owner: followerId,
        }).lean()
        const reputationId = oldReputation._id.toString()

        await request(app)
            .post('/api/account/follow')
            .set('accountId', '1')
            .send({
                type: 'club',
                resourceId: clubId,
            })
            .expect(httpStatus.OK)

        const follower = await Account.findById(followerId).lean()
        const following = await Club.findById(clubId).lean()

        expect(oldFollower.followingClubs).not.toContain(clubId)
        expect(follower.followingClubs).toContain(clubId)

        expect(oldClub.followers).not.toContain(followerId)
        expect(following.followers).toContain(followerId)

        expect(following.followersCount - oldClub.followersCount).toEqual(1)

        const reputation = await Reputation.findById(reputationId).lean()
        expect(oldReputation.member).toBeFalsy()
        expect(reputation.member).toBeTruthy()

        await request(app)
            .post('/api/account/follow')
            .set('accountId', '1')
            .send({
                type: 'club',
                resourceId: clubId,
            })
            .expect(httpStatus.CONFLICT)

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', '1')
            .send({
                type: 'club',
                resourceId: clubId,
            })
            .expect(httpStatus.OK)

        const newFollower = await Account.findById(followerId).lean()
        expect(newFollower).not.toBeNull()

        const newFollowing = await Club.findById(clubId).lean()
        expect(newFollowing).not.toBeNull()

        expect(follower.followingClubs).toContain(clubId)
        expect(newFollower.followingClubs).not.toContain(clubId)

        expect(following.followers).toContain(followerId)
        expect(newFollowing.followers).not.toContain(followerId)

        expect(following.followersCount - newFollowing.followersCount).toEqual(
            1
        )

        const newReputation = await Reputation.findById(reputationId).lean()

        expect(newReputation.member).toBeFalsy()

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', '1')
            .send({
                type: 'club',
                resourceId: clubId,
            })
            .expect(httpStatus.CONFLICT)
    })

    test('should return 200 and successfully follow question, return 400 if follow again, return 200 if unfollow and 400 on unfollow again', async () => {
        const oldFollower = await Account.findOne({ facebookProfile: '1' })
        const followerId = oldFollower._id.toString()

        const oldQuestion = await Question.findOne({
            followers: { $ne: followerId },
        })
        const questionId = oldQuestion._id.toString()

        await request(app)
            .post('/api/account/follow')
            .set('accountId', '1')
            .send({
                type: 'question',
                resourceId: questionId,
            })
            .expect(httpStatus.OK)

        const follower = await Account.findById(followerId).lean()
        const following = await Question.findById(questionId).lean()

        expect(oldFollower.followingQuestions).not.toContain(questionId)
        expect(follower.followingQuestions).toContain(questionId)

        expect(oldQuestion.followers).not.toContain(followerId)
        expect(following.followers).toContain(followerId)

        expect(following.followersCount - oldQuestion.followersCount).toEqual(1)

        await request(app)
            .post('/api/account/follow')
            .set('accountId', '1')
            .send({
                type: 'question',
                resourceId: questionId,
            })
            .expect(httpStatus.CONFLICT)

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', '1')
            .send({
                type: 'question',
                resourceId: questionId,
            })
            .expect(httpStatus.OK)

        const newFollower = await Account.findById(followerId).lean()
        expect(newFollower).not.toBeNull()

        const newFollowing = await Question.findById(questionId).lean()
        expect(newFollowing).not.toBeNull()

        expect(follower.followingQuestions).toContain(questionId)
        expect(newFollower.followingQuestions).not.toContain(questionId)

        expect(following.followers).toContain(followerId)
        expect(newFollowing.followers).not.toContain(followerId)

        expect(following.followersCount - newFollowing.followersCount).toEqual(
            1
        )

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', '1')
            .send({
                type: 'question',
                resourceId: questionId,
            })
            .expect(httpStatus.CONFLICT)
    })

    test('should return 400 error if  validation fails', async () => {
        const oldFollowing = await Account.findOne({ facebookProfile: '1' })
        const followingId = oldFollowing._id.toString()

        await request(app)
            .post('/api/account/follow')
            .set('accountId', '0')
            .send({
                type: 'acdfgfdgcount',
                resourceId: followingId,
            })
            .expect(httpStatus.BAD_REQUEST)

        await request(app)
            .post('/api/account/unfollow')
            .set('accountId', '0')
            .send({
                type: 'reputation',
            })
            .expect(httpStatus.BAD_REQUEST)
    })
})
