const express = require('express')
const UserService = require('./user-service')
const jwt = require('jsonwebtoken')

const userRouter = express.Router()
const jsonParser = express.json()

function createUserJwt(user) {
    return jwt.sign({ ...user }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

userRouter
    .route('/signup')
    .post(jsonParser, (req, res, next) => {
        const { email, password } = req.body
        const newUser = { email, password }

        for (const [key, value] of Object.entries(newUser)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                })
            }
        }

        UserService.insertUser(
            req.app.get('db'),
            newUser
        )
            .then(user => {
                res
                    .status(201)
                    .json(createUserJwt(user))
            })
            .catch(next)
    })

userRouter
    .route('/login')
    .post(jsonParser, (req, res, next) => {
        const { email, password } = req.body
        UserService.validateCredentials(req.app.get('db'), email, password)
            .then(user => {
                if (!user) {
                    return res.status(404).json({
                        error: { message: `Username or password does not match` }
                    })
                }
                return res
                    .status(200)
                    .json(createUserJwt(user))
            })
    })

module.exports = userRouter