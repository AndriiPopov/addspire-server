const express = require('express')
const { resSendError } = require('../utils/resError')
const Joi = require('@hapi/joi')
const { JoiLength } = require('../constants/fieldLength')

const { Advice } = require('../models/advice')
const { Account } = require('../models/account')
const { Board } = require('../models/board')
const { Community } = require('../models/community')
const { Place } = require('../models/place')
const { People } = require('../models/people')
const router = express.Router()

const findProgressesSchema = Joi.object({
    value: Joi.string().max(JoiLength.name),
    skip: Joi.number(),
    skip: Joi.string(),
}).unknown(true)

router.post('/search', async (req, res, next) => {
    try {
        // const { error } = findProgressesSchema.validate(req.body)

        // if (error) {
        //     console.log(error)
        //     resSendError(res, 'Bad data!')
        //     return
        // }

        const search = req.body.value
        let model = Advice
        let sortString = { usersCount: -1, savedCount: -1, likesCount: -1 }
        let selectString = {
            usersCount: 1,
            likesCount: 1,
            savedCount: 1,
            name: 1,
            owner: 1,
            image: 1,
        }
        switch (search.type) {
            case 'board':
                model = Board
                sortString = {
                    savedCount: -1,
                    likesCount: -1,
                    itemsCount: -1,
                }
                selectString = {
                    savedCount: 1,
                    likesCount: 1,
                    itemsCount: 1,
                    name: 1,
                    owner: 1,
                    image: 1,
                }
                break
            case 'account':
                model = Account
                sortString = {
                    followersCount: -1,
                    boardsCount: -1,
                    communitiesCount: -1,
                }
                selectString = {
                    followersCount: 1,
                    boardsCount: 1,
                    communitiesCount: 1,
                    name: 1,
                    image: 1,
                }
                break
            case 'community':
                model = Community
                sortString = {
                    usersCount: -1,
                    boardsCount: -1,
                    advicesCount: -1,
                }
                selectString = {
                    usersCount: 1,
                    boardsCount: 1,
                    advicesCount: 1,
                    placesCount: 1,
                    peopleCount: 1,
                    name: 1,
                    image: 1,
                }
                break
            case 'people':
                model = People
                sortString = {
                    likesCount: -1,
                    savedCount: -1,
                }
                selectString = {
                    likesCount: 1,
                    shortDescription: 1,
                    name: 1,
                    owner: 1,
                    image: 1,
                }
                break
            case 'place':
                model = Place
                sortString = {
                    likesCount: -1,
                    savedCount: -1,
                }
                selectString = {
                    likesCount: 1,
                    name: 1,
                    owner: 1,
                    image: 1,
                }
                break
        }

        const query = {}
        let isSearch
        // if (search.withMap) {
        //     query.position = {
        //         $geoWithin: {
        //             $centerSphere: [
        //                 [search.position[1], search.position[0]],
        //                 search.distance / (search.units === 'mi' ? 3963 : 6377),
        //             ],
        //         },
        //     }
        //     isSearch = true
        // }
        if (search.value) {
            query.name = new RegExp(search.value, 'gi')
            isSearch = true
        }
        // if (search.categories.length > 0) {
        //     query.category = {
        //         $elemMatch: {
        //             $in: search.categories,
        //         },
        //     }
        //     isSearch = true
        // }
        // const progresses = await model
        //     .find(isSearch ? query : undefined)
        //     .sort('views')
        //     .skip(req.body.skip)
        //     .limit(20)
        //     .select('__v owner name images users views status')
        //     .lean()
        //     .exec()

        const progresses = await model.aggregate([
            ...(search.value
                ? [
                      search.type !== 'account'
                          ? {
                                $search: {
                                    text: {
                                        query: search.value,
                                        path: {
                                            value: 'name',
                                            multi: req.body.language,
                                        },
                                    },
                                },
                            }
                          : {
                                $match: {
                                    name: {
                                        $regex: search.value,
                                        $options: 'gi',
                                    },
                                },
                            },
                  ]
                : []),
            { $sort: sortString },
            { $skip: req.body.skip },
            { $limit: 100 },
            { $project: selectString },
        ])

        let accountD = progresses.map(item =>
            search.type === 'account' ? item._id : item.owner
        )

        accountD = await Account.find({
            _id: { $in: accountD },
        })
            .select('name image')
            .lean()
            .exec()

        res.send({
            progresses,
            accountD,
            success: true,
            noMore: progresses.length < 100,
        })
    } catch (ex) {
        console.log(ex)
    }
})

module.exports = router
