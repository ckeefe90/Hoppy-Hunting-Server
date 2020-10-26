const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../../src/app')
const BreweryService = require('../../src/brewery/brewery-service')
const UserService = require('../../src/user/user-service')
const { makeUserArray } = require('../user/user.fixtures')
const { makeBreweryArray, makeMaliciousBrewery, getUserAuthToken } = require('./brewery.fixtures')

describe('Brewery Endpoints', function () {
    const testUsers = makeUserArray()
    const testBreweries = makeBreweryArray()
    let db

    function populateTestData() {
        return db
            .into('users')
            .insert(testUsers)
            .then(() => db
                .into('breweries')
                .insert(testBreweries))
    }

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    beforeEach('clean the table', async () => {
        await db.raw('TRUNCATE breweries RESTART IDENTITY CASCADE')
        await db.raw('TRUNCATE users RESTART IDENTITY CASCADE')
    })

    afterEach('cleanup', async () => {
        await db.raw('TRUNCATE breweries RESTART IDENTITY CASCADE')
        await db.raw('TRUNCATE users RESTART IDENTITY CASCADE')
    })

    describe('Unauthorized requests', () => {
        it('responds with 401 Unauthorized for GET /api/breweries', () => {
            return supertest(app)
                .get('/api/breweries')
                .expect(401, { error: 'Unauthorized request' })
        })
        it('responds with 401 Unauthorized for GET /api/breweries/:breweryId', () => {
            const breweryId = 1
            return supertest(app)
                .get(`/api/breweries/:${breweryId}`)
                .expect(401, { error: 'Unauthorized request' })
        })
        it('responds with 401 Unauthorized for POST /api/breweries', () => {
            return supertest(app)
                .post('/api/breweries')
                .expect(401, { error: 'Unauthorized request' })
        })
        it('responds with 401 Unauthorized for DELETE /api/breweries/:breweryId', () => {
            const breweryId = 1
            return supertest(app)
                .delete(`/api/breweries/:${breweryId}`)
                .expect(401, { error: 'Unauthorized request' })
        })
    })

    describe('GET /api/breweries', () => {
        context('Given no brewery', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/breweries')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, [])
            })
        })
        context('Given there are breweries in the database', () => {

            beforeEach('insert users and breweries', () => populateTestData())

            it('responds with 200 and a list of breweries', () => {
                return supertest(app)
                    .get('/api/breweries')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBreweries.map(brewery => ({ ...brewery, rating: null })))
            })

            context('Given a specific user is authenticated', () => {
                it('responds with 200 and a list of the users breweries', () => {
                    const user = testUsers[1]
                    return supertest(app)
                        .get('/api/breweries')
                        .set('Authorization', `Bearer ${getUserAuthToken(user)}`)
                        .expect(200, testBreweries.filter(brewery => brewery.user_id === user.id).map(brewery => ({ ...brewery, rating: null })))
                })
            })
        })
    })

    describe('GET /api/breweries/:brewery_id', () => {
        context('Given no breweries', () => {
            it('responds with 404', () => {
                const breweryId = 123456
                return supertest(app)
                    .get(`/api/breweries/${breweryId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: "Brewery doesn't exist" } })
            })
        })
        context('Given there are breweries in the database', () => {

            beforeEach('insert users and breweries', () => populateTestData())

            it('responds with 200 and the specified brewery', () => {
                const breweryId = 2
                const expectedBrewery = testBreweries.find(brewery => brewery.id === breweryId)
                return supertest(app)
                    .get(`/api/breweries/${breweryId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, { ...expectedBrewery, rating: null })
            })

            context('Given a specific user is authenticated', () => {
                const user = testUsers[1]
                it('responds with 200 and the specified brewery if it belongs to the user', () => {
                    const breweryId = 2
                    const expectedBrewery = testBreweries.find(brewery => brewery.id === breweryId)
                    return supertest(app)
                        .get(`/api/breweries/${breweryId}`)
                        .set('Authorization', `Bearer ${getUserAuthToken(user)}`)
                        .expect(200, { ...expectedBrewery, rating: null })
                })
                it('responds with a 403 if the specified brewery does not belong to the user', () => {
                    const breweryId = 3
                    const expectedBrewery = testBreweries.find(brewery => brewery.id === breweryId)
                    return supertest(app)
                        .get(`/api/breweries/${breweryId}`)
                        .set('Authorization', `Bearer ${getUserAuthToken(user)}`)
                        .expect(403, { error: { message: `Access is forbidden` } })
                })
            })
        })

        context(`Given an XSS attack brewery`, () => {
            const {
                maliciousBrewery,
                expectedBrewery,
            } = makeMaliciousBrewery()

            beforeEach('insert malicious brewery', () => {
                return db
                    .into('users')
                    .insert(testUsers)
                    .then(() => db
                        .into('breweries')
                        .insert([maliciousBrewery]))
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/breweries/${maliciousBrewery.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eql(expectedBrewery.name)
                        expect(res.body.address).to.eql(expectedBrewery.address)
                        expect(res.body.comments).to.eql(expectedBrewery.comments)
                    })
            })
        })
    })

    describe(`POST /api/breweries`, () => {
        beforeEach('insert users', () => {
            return db
                .into('users')
                .insert(testUsers)
        })

        it(`creates an brewery, responding with 201 and the new brewery`, function () {
            const newBrewery = {
                name: 'Test new brewery',
                address: 'Brewery address',
                comments: 'Test new brewery comments',
                user_id: 1
            }
            return supertest(app)
                .post('/api/breweries')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newBrewery)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newBrewery.name)
                    expect(res.body.address).to.eql(newBrewery.address)
                    expect(res.body.comments).to.eql(newBrewery.comments)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/breweries/${res.body.id}`)
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/breweries/${postRes.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body)
                })
        })

        const requiredFields = ['name', 'address']

        requiredFields.forEach(field => {
            const newBrewery = {
                name: 'Test new name',
                address: 'Test new address',
                comments: "Test new comments",
                user_id: 1
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newBrewery[field]
                return supertest(app)
                    .post('/api/breweries')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newBrewery)
                    .expect(400, { error: { message: `Missing '${field}' in request body` } })
            })
        })

        context('Given a specific user is authenticated', () => {
            it('creates an brewery that belongs to the user responding with 201 and the new brewery', () => {
                const user = testUsers[1]
                const newBrewery = {
                    name: 'Test new brewery',
                    address: 'Brewery address',
                    comments: 'Test new brewery comments',
                }
                return supertest(app)
                    .post('/api/breweries')
                    .set('Authorization', `Bearer ${getUserAuthToken(user)}`)
                    .send(newBrewery)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.name).to.eql(newBrewery.name)
                        expect(res.body.address).to.eql(newBrewery.address)
                        expect(res.body.comments).to.eql(newBrewery.comments)
                        expect(res.body.user_id).to.eql(user.id)
                        expect(res.body).to.have.property('id')
                        expect(res.headers.location).to.eql(`/api/breweries/${res.body.id}`)
                    })
                    .then(postRes => {
                        supertest(app)
                            .get(`/api/breweries/${postRes.body.id}`)
                            .set('Authorization', `Bearer ${getUserAuthToken(user)}`)
                            .expect(postRes.body)
                    })
            })
        })
    })

    describe(`DELETE /api/breweries/:brewery_id`, () => {
        context('Given no brewery', () => {
            it('responds with 404', () => {
                const breweryId = 123456
                return supertest(app)
                    .delete(`/api/breweries/${breweryId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: "Brewery doesn't exist" } })
            })
        })
        context('Given there are breweries in the database', () => {

            beforeEach('insert users and breweries', () => populateTestData())

            it('responds with 204 and removes the brewery', () => {
                const idToRemove = 2
                return supertest(app)
                    .delete(`/api/breweries/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(() =>
                        supertest(app)
                            .get(`/api/breweries/${idToRemove}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(404, { error: { message: `Brewery doesn't exist` } })
                    )
            })
        })

    })

    describe(`PATCH /api/breweries/:brewery_id`, () => {
        context(`Given no brewery`, () => {
            it(`responds with 404`, () => {
                const breweryId = 123456
                return supertest(app)
                    .patch(`/api/breweries/${breweryId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: `Brewery doesn't exist` } })
            })
        })
        context('Given there are breweries in the database', () => {

            beforeEach('insert users and breweries', () => populateTestData())

            it('responds with 204 and updates the brewery', () => {
                const idToUpdate = 2
                const updateBrewery = {
                    name: 'updated brewery name',
                    address: 'updated brewery address',
                    comments: 'updated brewery comments',
                    rating: '3'
                }
                const expectedBrewery = {
                    ...testBreweries[idToUpdate - 1],
                    ...updateBrewery
                }
                return supertest(app)
                    .patch(`/api/breweries/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateBrewery)
                    .expect(204)
                    .then(res => supertest(app)
                        .get(`/api/breweries/${idToUpdate}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(expectedBrewery)
                    )
            })

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/breweries/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, { error: { message: `Request body must contain at least one of name, address, comments, rating` } })
            })

            it(`responds with 400 and an error message when the 'rating' is invalid`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/breweries/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        rating: "8"
                    })
                    .expect(400, { error: { message: 'Rating must be one of 1, 2, 3, 4, 5' } })
            })

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateBrewery = {
                    name: 'updated brewery name',
                }
                const expectedBrewery = {
                    ...testBreweries[idToUpdate - 1],
                    ...updateBrewery,
                    rating: null
                }
                return supertest(app)
                    .patch(`/api/breweries/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateBrewery,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/breweries/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBrewery)
                    )
            })
        })
    })
})