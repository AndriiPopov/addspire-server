module.exports.heartbeat = async (ws, data) => {
    try {
        ws.isAlive = true
    } catch (ex) {}
}
