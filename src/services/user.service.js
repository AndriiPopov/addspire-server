const httpStatus = require('http-status')
const bcrypt = require('bcryptjs')
const ApiError = require('../utils/ApiError')
const { Account } = require('../models')

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUserEM = async (userBody) => {
    // if (await Account.isEmailTaken(userBody.email)) {
    //     throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
    // }
    let account = new Account({
        name: userBody.name || userBody.email,
        userid: userBody.email,
        platformId: 'email',
        logoutAllDate: new Date().getTime() - 10 * 60 * 1000,
        password: await bcrypt.hash(userBody.password.password, 8),
    })

    account = await account.save()
    return account
}

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
    } catch (ex) {
        console.log('Create user failed.')
        console.log(ex)
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
    } catch (ex) {
        console.log(ex)
        console.log('Create user failed.')
    }
}

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
    const users = await User.paginate(filter, options)
    return users
}

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => User.findById(id)

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => User.findOne({ email })

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
    const user = await getUserById(userId)
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    // if (
    //     updateBody.email &&
    //     (await User.isEmailTaken(updateBody.email, userId))
    // ) {
    //     throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
    // }
    Object.assign(user, updateBody)
    await user.save()
    return user
}

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
    const user = await getUserById(userId)
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found')
    }
    await user.remove()
    return user
}

module.exports = {
    createUserEM,
    createUserFB,
    createUserGG,
    queryUsers,
    getUserById,
    getUserByEmail,
    updateUserById,
    deleteUserById,
}
