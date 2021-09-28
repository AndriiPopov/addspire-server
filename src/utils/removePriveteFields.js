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

    if (doc.appleProfile) newDoc.appleProfile = true
    if (doc.facebookProfile) newDoc.facebookProfile = true
    if (doc.googleProfile) newDoc.googleProfile = true
    return newDoc
}
