const ping = require('ping')

module.exports = () => {
    setInterval(
        () => ping.sys.probe('https://addspire-blog.herokuapp.com/', () => {}),
        600000
    )
}
