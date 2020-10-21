const knex = require('knex')
const app = require('../../src/app')
const { makeUserArray, makeMaliciousUser } = require('./user.fixtures')

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

    describe(`GET /api/users`, () => {
        context(`Given no users`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/users')
                    .expect(200, [])
            })
        })

        context('Given there are users in the database', () => {
            const testUsers = makeUserArray();

            beforeEach('insert user', () => {
                return db
                    .into('users')
                    .insert(testUsers)
            })

            it('responds with 200 and all of the users', () => {
                return supertest(app)
                    .get('/api/users')
                    .expect(200, testUsers)
            })
        })

        context(`Given an XSS attack user`, () => {
            const { maliciousUser, expectedUser } = makeMaliciousUser()

            beforeEach('insert malicious User', () => {
                return db
                    .into('users')
                    .insert([maliciousUser])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/users`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].email).to.eql(expectedUser.email)
                    })
            })
        })
    })

    describe(`GET /api/users/:user_id`, () => {
        context(`Given no user`, () => {
            it(`responds with 404`, () => {
                const userId = 123456
                return supertest(app)
                    .get(`/api/users/${userId}`)
                    .expect(404, { error: { message: `User doesn't exist` } })
            })
        })

        context('Given there are users in the database', () => {
            const testUsers = makeUserArray()

            beforeEach('insert user', () => {
                return db
                    .into('users')
                    .insert(testUsers)
            })

            it('responds with 200 and the specified user', () => {
                const userId = 2
                const expectedUser = testUsers[userId - 1]
                return supertest(app)
                    .get(`/api/users/${userId}`)
                    .expect(200, expectedUser)
            })
        })

        context(`Given an XSS attack user`, () => {
            const { maliciousUser, expectedUser } = makeMaliciousUser()

            beforeEach('insert malicious user', () => {
                return db
                    .into('users')
                    .insert([maliciousUser])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/users/${maliciousUser.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.email).to.eql(expectedUser.email)
                    })
            })
        })
    })

    describe(`POST /api/users`, () => {
        it(`creates a user, responding with 201 and the new user`, () => {
            const newUser = {
                email: 'Test new User'
            }
            return supertest(app)
                .post('/api/users')
                .send(newUser)
                .expect(201)
                .expect(res => {
                    expect(res.body.email).to.eql(newUser.email)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/users/${res.body.id}`)
                        .expect(res.body)
                )
        })

        const requiredFields = ['email']

        requiredFields.forEach(field => {
            const newUser = {
                email: 'Test new user'
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newUser[field]

                return supertest(app)
                    .post('/api/users')
                    .send(newUser)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })

        it('removes XSS attack content from response', () => {
            const { maliciousUser, expectedUser } = makeMaliciousUser()
            return supertest(app)
                .post(`/api/users`)
                .send(maliciousUser)
                .expect(201)
                .expect(res => {
                    expect(res.body.email).to.eql(expectedUser.email)
                })
        })
    })

})