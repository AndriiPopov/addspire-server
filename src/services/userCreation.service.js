const httpStatus = require('http-status')
const ApiError = require('../utils/ApiError')
const { Account } = require('../models')

const createUserFB = async (profile, done) => {
    try {
        let account = await Account.findOne({
            facebookProfile: profile.id.toString(),
        })
            .select('accountInfo image __v')
            .exec()
        if (!account) {
            let name = profile.displayName || profile.username
            name = name && name.trim().length > 1 && name.trim()
            account = new Account({
                facebookProfile: profile.id.toString(),
                userid: profile.id,
                platformId: 'facebook',
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
            })
            const defaultProfile = account.profiles.create({
                name: name || `User ${profile.id}`,
                label: 'General profile',
            })
            if (
                profile.photos &&
                profile.photos.length > 0 &&
                profile.photos[0].value
            ) {
                defaultProfile.image = profile.photos[0].value
            }
            account.profiles.push(defaultProfile)
            account.defaultProfile = defaultProfile._id
        }

        account.accountInfo = {
            displayName: profile.displayName,
            emails: [profile.email],
            photos: [profile.picture],
            userid: profile.id,
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
            googleProfile: profile.id.toString(),
        })
            .select('_id accountInfo image __v')
            .exec()
        if (!account) {
            let name = profile.displayName || profile.username
            name = name && name.trim().length > 1 && name.trim()
            account = new Account({
                googleProfile: profile.id.toString(),
                platformId: 'google',
                userid: profile.id,
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
            })

            const defaultProfile = account.profiles.create({
                name: name || `User ${profile.id}`,
                label: 'General profile',
            })
            if (
                profile.photos &&
                profile.photos.length > 0 &&
                profile.photos[0].value
            ) {
                defaultProfile.image = profile.photos[0].value
            }
            account.profiles.push(defaultProfile)
            account.defaultProfile = defaultProfile._id
        }
        account.accountInfo = {
            displayName: profile.displayName,
            emails: profile.emails,
            photos: profile.photos,
            userid: profile.id,
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

const createUserApple = async (profile, done) => {
    try {
        let account = await Account.findOne({
            appleProfile: profile.id.toString(),
        })
            .select('accountInfo image __v')
            .exec()
        if (!account) {
            let name = profile.displayName || profile.username
            name = name && name.trim().length > 1 && name.trim()
            if (!name) {
                name = `User ${profile.id.trim()}`
                if (name.length > 10) name = name.substring(0, 10)
            }
            account = new Account({
                appleProfile: profile.id.toString(),
                userid: profile.id,
                platformId: 'apple',
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
            })
            const defaultProfile = account.profiles.create({
                name,
                label: 'General profile',
            })
            account.profiles.push(defaultProfile)
            account.defaultProfile = defaultProfile._id
        }

        account.accountInfo = {
            displayName: profile.displayName,
            emails: [profile.email],
            userid: profile.id,
        }
        account.markModified('accountInfo')
        account = await account.save()
        if (account) return await done(null, account)
        return done()
    } catch (error) {
        throw new ApiError(httpStatus.CONFLICT, 'Not created')
    }
}

module.exports = {
    createUserFB,
    createUserGG,
    createUserGH,
    createUserApple,
}
