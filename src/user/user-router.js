const express = require('express')
const UserService = require('./user-service')

const userRouter = express.Router()
const jsonParser = express.json()

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
                    .json(user)
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
                    .json(user)
            })
    })

module.exports = userRouter