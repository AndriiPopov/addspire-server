const { Account } = require('../models/account')
const { Progress } = require('../models/progress')
const { Post } = require('../models/post')
const { get } = require('../startup/redis')
const { Board } = require('../models/board')
const { Document } = require('../models/document')
const { Community } = require('../models/community')
const { People } = require('../models/people')
const { Place } = require('../models/place')
const { Survey } = require('../models/survey')
const { Structure } = require('../models/structure')
const { Advice } = require('../models/advice')
const { Step } = require('../models/schemas/step')

module.exports = async data => {
    if (data.type && data.ids && data.ids.length > 0) {
        let result
        const onlineUsers = []
        let model
        let fields
        switch (data.type) {
            case 'account':
                model = Account
                for (let user of data.ids)
                    if (await get(user)) onlineUsers.push(user)
                break
            case 'advice':
                model = Advice
                break
            case 'board':
                model = Board
                break
            case 'community':
                model = Community
                break
            case 'document':
                model = Document
                break
            case 'people':
                model = People
                break
            case 'place':
                model = Place
                break
            case 'post':
                model = Post
                break
            case 'progress':
                model = Progress
                break
            case 'structure':
                model = Structure
                break
            case 'survey':
                model = Survey
                break

            case 'accountD':
                model = Account
                fields =
                    'name image notifications boardsCount followersCount communitiesCount progressesCount __v'
                for (let user of data.ids) {
                    if (user && (await get(user))) onlineUsers.push(user)
                }
                break
            case 'adviceD':
                model = Advice
                fields =
                    'owner suggestedChanges name image notifications likesCount savedCount usersCount suggestedChangesCount date updated version community __v'
                break
            case 'boardD':
                model = Board
                fields =
                    'name suggestedChanges image itemsCount trend notifications likesCount savedCount suggestedChangesCount date updated version community owner __v'
                break
            case 'communityD':
                model = Community
                fields =
                    'name shortDescription suggestedChanges image itemsCount trend notifications likesCount followersCount usersCount boardsCount advicesCount peopleCount placesCount documentsCount surveysCount  suggestedChangesCount date updated version admins sadmins __v'
                break
            case 'documentD':
                model = Document
                fields =
                    'name suggestedChanges image shortDescription likesCount notifications followersCount  suggestedChangesCount date updated version  __v'
                break
            case 'peopleD':
                model = People
                fields =
                    'user suggestedChanges likesCount shortDescription notifications followersCount  suggestedChangesCount date updated version __v'
                break
            case 'placeD':
                model = Place
                fields =
                    'name suggestedChanges image shortDescription likesCount notifications followersCount suggestedChangesCount date updated version __v'
                break
            case 'postD':
                model = Post
                fields = 'notifications __v'
                break
            case 'progressD':
                model = Progress
                break
            case 'structureD':
                model = Structure
                break
            case 'surveyD':
                model = Structure
                fields =
                    'name suggestedChanges image shortDescription likesCount notifications followersCount url suggestedChangesCount date updated version __v'
                break

            default:
                break
        }

        if (model) {
            if (!fields) {
                result = await model
                    .find({
                        _id: { $in: data.ids },
                    })
                    .lean()
                    .exec()
            } else {
                result = await model
                    .find({
                        _id: { $in: data.ids },
                    })
                    .select(fields)
                    .lean()
                    .exec()
            }
        }

        return [result, fields, onlineUsers]
    }
}
