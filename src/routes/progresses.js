const auth = require('../middleware/auth')
const authNotForce = require('../middleware/authNotForce')

const { Progress } = require('../models/progress')
const { Account } = require('../models/account')
const express = require('express')
const getAccount = require('../utils/getAccount')

const router = express.Router()

router.get('/', auth, async (req, res, next) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(req, res, 'name progresses')
        }

        const progressesData = await Progress.find({
            _id: { $in: account.progresses },
        })
            .lean()
            .exec()

        res.send({
            account: {
                ...account,
            },
            progressesData,
            success: true,
        })
    } catch (ex) {}
})

router.get('/:ownerId/:id', authNotForce, async (req, res, next) => {
    try {
        const progressId = req.params.ownerId + '/' + req.params.id
        let progress = await Progress.findById(progressId)
            .select('-patch')
            .lean()
            .exec()
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name image friends',
                false,
                true
            )
        }
        if (progress) {
            let accountIds = [
                progress.owner,
                progress.worker,
                ...progress.goal.supporters,
                ...progress.goal.experts,
                ...account.friends.map(item => item.friend),
            ]

            accountIds = [...new Set(accountIds)]
            const friends = await Account.find({
                _id: { $in: accountIds },
            })
                .select('name')
                .lean()
                .exec()
            res.send({
                progress,
                account: {
                    ...account,
                    friendsData: friends,
                },
                success: true,
            })
        } else {
            res.send({
                success: false,
            })
        }
    } catch (ex) {
        console.log(ex)
    }
})

router.post('/add', auth, async (req, res) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'friends goals progresses currentId',
                true
            )
        }
        const { userId, ownerId, goalId } = req.body

        if (ownerId === account._id || userId === account._id) {
            let owner, user, goal
            if (userId === account._id) {
                user = account
            } else {
                user = await Account.findById(userId)
                    .select('friends goals progresses currentId')
                    .exec()
            }

            if (ownerId === account._id) {
                owner = account
            } else {
                owner = await Account.findById(ownerId)
                    .select('friends goals progresses currentId')
                    .exec()
            }
            if (user && owner) {
                const goal = owner.goals.find(goal => goal.goalId === goalId)
                if (goal) {
                    const existingProgressesIds = goal.progresses
                        .filter(progress => progress.userId === userId)
                        .map(progress => progress.userId)
                    const existingProgressesObjs = await Progress.find({
                        _id: { $in: existingProgressesIds },
                    })
                        .select('status')
                        .lean()
                        .exec()
                    if (
                        !existingProgressesObjs.find(
                            item => item.status === 'not started'
                        )
                    ) {
                        const { progresses, ...progressValue } = goal.toObject()

                        let progress = new Progress({
                            status:
                                userId !== ownerId
                                    ? 'not started'
                                    : 'in progress',
                            worker: user._id,
                            owner: owner._id,
                            goal: progressValue,
                            _id: owner._id + '/progress' + owner.currentId,
                            stages: [
                                {
                                    milestoneId: 'start',
                                    approvedBy:
                                        owner._id === user._id
                                            ? []
                                            : [
                                                  {
                                                      accountId:
                                                          account._id ===
                                                          user._id
                                                              ? user._id
                                                              : owner._id,
                                                  },
                                              ],
                                },
                            ],
                        })

                        owner.currentId = owner.currentId + 1
                        progress = await progress.save()
                        goal.progresses.push({
                            progressId: progress._id,
                            userId,
                        })

                        const expertsAndSupporters = [
                            ...new Set([...goal.experts, ...goal.supporters]),
                        ].filter(item => item !== ownerId && item !== userId)
                        const ggg = await Account.updateMany(
                            { _id: { $in: expertsAndSupporters } },
                            {
                                $push: { progresses: progress._id },
                            }
                        )

                        owner.progresses.push(progress._id)
                        if (ownerId !== userId) {
                            user.progresses.push(progress._id)
                            user.save()
                        }

                        owner.save()

                        res.send({ success: true })
                        return
                    } else {
                        res.send({ progressExists: true })
                        return
                    }
                }
            }
        }
        res.send({ success: false })
    } catch (ex) {
        // console.log(ex)
    }
})

router.post('/delete/:id', auth, async (req, res) => {
    try {
        let account
        if (req.user) {
            account = await getAccount(
                req,
                res,
                'name friends goals currentId',
                true
            )
        }
        const goalId = req.params.id
        if (goalId) {
            account.goals = account
                .toObject()
                .goals.filter(goal => goal.goalId !== goalId)
        }
        account.save()
        let friends = account.friends.map(item => item.friend)
        friends = await Account.find({
            _id: { $in: friends },
        })
            .select('name image goals')
            .lean()
            .exec()
        res.send({
            account: {
                ...account.toObject(),
                friendsData: friends,
            },
            success: true,
        })
    } catch (ex) {}
})

router.delete('/:id', [auth], async (req, res) => {
    try {
        let goalId = req.params.id
        if (goalId) {
            req.user.goals = req.user.goals.filter(
                goal => goal.goalId !== goalId
            )
            req.user.save()
        }
        res.send({ goalId })
    } catch (ex) {}
})

module.exports = router
