require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV, CLIENT_ORIGIN } = require('./config')
const userRouter = require('./user/user-router')
const breweryRouter = require('./brewery/brewery-router')
const logger = require('./logger')
const UserService = require('./user/user-service')

const app = express()

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.use('/api', userRouter)

app.use(async function validateToken(req, res, next) {
    function unauthorized() {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized request' })
    }

    const apiToken = process.env.API_TOKEN;
    const authToken = req.get('Authorization');

    if (!authToken) {
        return unauthorized()
    }
    const [authType, token] = authToken.split(' ');
    if (authType === "Bearer" && token !== apiToken) {
        return unauthorized()
    }
    if (authType === "Basic") {
        const [email, password] = Buffer.from(token, 'base64').toString().split(':');
        const user = await UserService.validateCredentials(req.app.get('db'), email, password)
        if (!user) {
            return unauthorized()
        }
        res.locals.user_id = user.id;
    }
    // move to the next middleware
    next()
})

app.use('/api/breweries', breweryRouter)

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error("error:", error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app