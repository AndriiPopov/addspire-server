module.exports = (doc) => {
    const {
        googleProfile,
        appleProfile,
        facebookProfile,
        tokens,
        accountInfo,
        userid,
        platformId,
        logoutAllDate,
        accessToken,
        code,
        refreshToken,
        expoTokens,
        ...newDoc
    } = {
        ...doc,
    }
    return newDoc
}
