const httpStatus = require('http-status')
const ApiError = require('../utils/ApiError')
const { Account } = require('../models')

const createUserFB = async (profile, done) => {
    try {
        let account = await Account.findOne({
            facebookProfile: `f_${profile.id}`,
        })
            .select('accountInfo image __v')
            .exec()
        if (!account) {
            let name = profile.displayName || profile.username
            name = name && name.length > 1 && name
            account = new Account({
                facebookProfile: `f_${profile.id}`,
                name: name || `f_${profile.id}`,
                userid: profile.id,
                platformId: 'facebook',
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
            })
        }

        account.accountInfo = {
            displayName: profile.displayName,
            emails: [profile.email],
            photos: [profile.picture],
            userid: profile.id,
        }
        if (
            profile.photos &&
            profile.photos.length > 0 &&
            profile.photos[0].value
        ) {
            account.image = profile.photos[0].value
        }
        account.markModified('accountInfo')
        account = await account.save()
        if (account) return await done(null, account)
        return done()
    } catch (error) {
        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    }
}

const createUserGG = async (profile, done) => {
    try {
        let account = await Account.findOne({
            googleProfile: `g_${profile.id}`,
        })
            .select('_id accountInfo image __v')
            .exec()
        if (!account) {
            let name = profile.displayName || profile.username
            name = name && name.length > 1 && name
            account = new Account({
                googleProfile: `g_${profile.id}`,
                name: name || `g_${profile.id}`,
                platformId: 'google',
                userid: profile.id,
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
            })
        }
        account.accountInfo = {
            displayName: profile.displayName,
            emails: profile.emails,
            photos: profile.photos,
            userid: profile.id,
        }
        if (
            profile.photos &&
            profile.photos.length > 0 &&
            profile.photos[0].value
        ) {
            account.image = profile.photos[0].value
        }
        account.markModified('accountInfo')
        account = await account.save()
        if (account) return done(null, account)
        return done()
    } catch (error) {
        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    }
}

const createUserGH = async (profile, done) => {
    try {
        let account = await Account.findOne({
            googleProfile: `h_${profile.id}`,
        })
            .select('_id accountInfo image __v')
            .exec()
        if (!account) {
            let name = profile.displayName || profile.username
            name = name && name.length > 1 && name
            account = new Account({
                googleProfile: `h_${profile.id}`,
                name: name || `h_${profile.id}`,
                platformId: 'github',
                userid: profile.id,
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
            })
        }
        account.accountInfo = {
            displayName: profile.displayName,
            emails: profile.emails,
            photos: profile.photos,
            userid: profile.id,
        }
        if (
            profile.photos &&
            profile.photos.length > 0 &&
            profile.photos[0].value
        ) {
            account.image = profile.photos[0].value
        }
        account.markModified('accountInfo')
        account = await account.save()
        if (account) return done(null, account)
        return done()
    } catch (error) {
        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    }
}

module.exports = {
    createUserFB,
    createUserGG,
    createUserGH,
}
