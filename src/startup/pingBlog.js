const ping = require('ping')

module.exports = () => {
    require('heroku-self-ping').default('https://addspire-blog.herokuapp.com/')

    setInterval(
        () => ping.sys.probe('https://addspire-blog.herokuapp.com/', () => {}),
        600000
    )
}
