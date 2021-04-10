const { Account } = require('../models/account')

module.exports.createUserFB = async (
    accessToken,
    refreshToken,
    profile,
    done
) => {
    try {
        let account = await Account.findById('f_' + profile.id)
            .select('_id')
            .lean()
            .exec()
        if (!account) {
            let name = profile.displayName || profile.username
            name = name && name.length > 1 && name
            account = new Account({
                _id: 'f_' + profile.id,
                name: name || 'f_' + profile.id,
                userid: profile.id,
                platformId: 'facebook',
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                accountInfo: {
                    displayName: profile.displayName,
                    emails: [profile.email],
                    photos: [profile.picture],
                    userid: profile.id,
                },
                accessToken,
                refreshToken,
            })
            if (
                profile.photos &&
                profile.photos.length > 0 &&
                profile.photos[0].value
            )
                account.image = profile.photos[0].value
            account.markModified('accountInfo')
            account = await account.save()
        }
        if (account) return done(null, account)
        else return done()
    } catch (ex) {
        console.log('Create user failed.')
        console.log(ex)
    }
}

module.exports.createUserGH = async (
    req,
    accessToken,
    refreshToken,
    profile,
    done
) => {
    try {
        let account = await Account.findById('h_' + profile.id)
            .select('_id')
            .lean()
            .exec()
        if (!account) {
            let name = profile.displayName || profile.username
            name = name && name.length > 1 && name
            account = new Account({
                _id: 'h_' + profile.id,
                name: name || 'h_' + profile.id,
                userid: profile.id,
                platformId: 'github',
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                accountInfo: {
                    displayName: profile.displayName,
                    emails: profile.emails,
                    photos: profile.photos,
                    userid: profile.id,
                },
                accessToken,
                refreshToken,
            })
            if (
                profile.photos &&
                profile.photos.length > 0 &&
                profile.photos[0].value
            )
                account.image = profile.photos[0].value
            account.markModified('accountInfo')
            account = await account.save()
        }
        if (account) return done(null, account)
        else return done()
    } catch (ex) {
        console.log(ex)
        console.log('Create user failed.')
    }
}

module.exports.createUserGG = async (
    accessToken,
    refreshToken,
    profile,
    done
) => {
    try {
        let account = await Account.findById('g_' + profile.id)
            .select('_id')
            .lean()
            .exec()
        if (!account) {
            let name = profile.displayName || profile.username
            name = name && name.length > 1 && name
            account = new Account({
                _id: 'g_' + profile.id,
                name: name || 'g_' + profile.id,
                platformId: 'google',
                userid: profile.id,
                logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
                accountInfo: {
                    displayName: profile.displayName,
                    emails: profile.emails,
                    photos: profile.photos,
                    userid: profile.id,
                },
                accessToken,
                refreshToken,
            })
            if (
                profile.photos &&
                profile.photos.length > 0 &&
                profile.photos[0].value
            )
                account.image = profile.photos[0].value
            account.markModified('accountInfo')
            account = await account.save()
        }
        if (account) return done(null, account)
        else return done()
    } catch {
        console.log('Create user failed.')
    }
}
