module.exports.resSendError = (res, code, logout) => {
    try {
        res.send({
            success: false,
            errorCode: code,
            logout,
        })
        return
    } catch (ex) {}
}
