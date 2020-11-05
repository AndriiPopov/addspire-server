const winston = require('winston')
const express = require('express')
const logging = require('./startup/logging')
const routes = require('./startup/routes')
const db = require('./startup/db')
const validation = require('./startup/validation')
const prod = require('./startup/prod')
const passport = require('passport')
const rateLimiterMiddleware = require('./middleware/rateLimiter')
const oneOffTask = require('./startup/oneOffTask')
const cors = require('cors')
const connectSocket = require('./startup/connectSocket')

const app = express()
prod(app)
app.use(cors())
app.options('*', cors())

// app.use(rateLimiterMiddleware)

app.use(passport.initialize())

logging()
routes(app)
db()
// sedtTimeout(oneOffTask, 3000)
validation()

app.use(express.static('./public'))

const port = process.env.PORT
const server = app.listen(port, () =>
    winston.info(`Listening on port ${port}...`)
)
connectSocket(server)

module.exports = server
