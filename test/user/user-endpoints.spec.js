const knex = require('knex')
const app = require('../../src/app')
const { makeUserArray } = require('./user.fixtures')
const jwt = require('jsonwebtoken')
const { expect } = require('chai')

describe('Users Endpoints', function () {
    let db

    before('make knex instance', () => {

        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)

    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE users RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE users RESTART IDENTITY CASCADE'))

    describe(`POST /api/signup`, () => {
        it(`creates a user, responding with 201 and the new user`, () => {
            const newUser = {
                email: 'Test new user',
                password: 'Test new password'
            }
            return supertest(app)
                .post('/api/signup')
                .send(newUser)
                .expect(201)
                .expect(res => {
                    const token = jwt.verify(res.body, process.env.JWT_SECRET)
                    expect(token).to.have.property('id')
                    const sevenDays = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
                    expect(token.exp).to.eql(sevenDays)
                })
        })

        const requiredFields = ['email', 'password']

        requiredFields.forEach(field => {
            const newUser = {
                email: 'Test new user',
                password: 'Test new password'
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newUser[field]

                return supertest(app)
                    .post('/api/signup')
                    .send(newUser)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })
    })

    describe(`POST /api/login`, () => {
        const testUsers = makeUserArray()

        beforeEach('insert users', () => {
            return db
                .into('users')
                .insert(testUsers)
        })
        it(`responds with a 404 if the username and password do not match`, () => {
            const existingUser = {
                email: 'Test new user',
                password: 'Test new password'
            }
            return supertest(app)
                .post('/api/login')
                .send(existingUser)
                .expect(404, { error: { message: `Username or password does not match` } })
        })
        it(`responds with a 200 if the username and password match`, () => {
            const existingUser = testUsers[0]
            return supertest(app)
                .post('/api/login')
                .send(existingUser)
                .expect(200)
                .expect(res => {
                    const token = jwt.verify(res.body, process.env.JWT_SECRET)
                    expect(token.id).to.eql(existingUser.id)
                    const sevenDays = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
                    expect(token.exp).to.eql(sevenDays)
                })
        })
    })
})