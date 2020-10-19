const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../../src/app')
const { makeBreweryArray } = require('./brewery.fixtures')

describe('Brewery Endpoints', function () {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_address,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('brewery').truncate())

    afterEach('cleanup', () => db('brewery').truncate())

    describe('Unauthorized requests', () => {
        it('responds with 401 Unauthorized for GET /api/brewery', () => {
            return supertest(app)
                .get('/api/brewery')
                .expect(401, { error: 'Unauthorized request' })
        })
        it('responds with 401 Unauthorized for GET /api/brewery/:breweryId', () => {
            const breweryId = 1
            return supertest(app)
                .get(`/api/brewery/:${breweryId}`)
                .expect(401, { error: 'Unauthorized request' })
        })
        it('responds with 401 Unauthorized for POST /api/brewery', () => {
            return supertest(app)
                .post('/api/brewery')
                .expect(401, { error: 'Unauthorized request' })
        })
        it('responds with 401 Unauthorized for DELETE /api/brewery/:breweryId', () => {
            const breweryId = 1
            return supertest(app)
                .delete(`/api/brewery/:${breweryId}`)
                .expect(401, { error: 'Unauthorized request' })
        })
    })

    describe('GET /api/brewery', () => {
        context('Given no brewery', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app).get('/api/brewery').set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(200, [])
            })
        })
        context('Given there is a brewery in the database', () => {
            const testBrewery = makeBreweryArray()

            beforeEach('insert brewery', () => {
                return db
                    .into('brewery')
                    .insert(testBrewery)
            })
        })
    })

    describe('GET /api/brewery/:brewery_id', () => {
        context('Given no brewery', () => {
            it('responds with 404', () => {
                const breweryId = 123456
                return supertest(app)
                    .get(`/api/brewery/${breweryId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: "Brewery doesn't exist" } })
            })
        })
        context('Given there is a brewery in the database', () => {
            const testUsers = makeUserArray()
            const testBrewery = makeBreweryArray()

            beforeEach('insert brewery', () => {
                return db
                    .into('brewery')
                    .insert(testBrewery)
            })

            it('responds with 200 and the specified brewery', () => {
                const breweryId = 2
                const expectedBrewery = testBrewery[breweryId - 1]
                return supertest(app)
                    .get(`/api/brewery/${breweryId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBrewery)
            })
        })

        context(`Given an XSS attack brewery`, () => {
            const {
                maliciousBrewery,
                expectedBrewery,
            } = makeMaliciousBrewery()

            beforeEach('insert malicious brewery', () => {
                return db
                    .into('brewery')
                    .insert([maliciousBrewery])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/brewery/${maliciousBrewery.id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.name).to.eql(expectedBrewery.name)
                        expect(res.body.address).to.eql(expectedBrewery.address)
                    })
            })
        })
    })

    describe(`POST /api/brewery`, () => {
        it(`creates an brewery, responding with 201 and the new brewery`, function () {
            const newBrewery = {
                name: 'Test new brewery',
                address: 'Brewery address',
                comments: 'Test new brewery comments',
                rating: '4'
            }
            return supertest(app)
                .post('/api/brewery')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newBrewery)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(newBrewery.name)
                    expect(res.body.address).to.eql(newBrewery.address)
                    expect(res.body.comments).to.eql(newBrewery.comments)
                    expect(res.body.rating).to.eql(newBrewery.rating)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/brewery/${res.body.id}`)
                })
                .then(postRes => {
                    supertest(app)
                        .get(`/api/brewery/${postRes.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body)
                })
        })

        const requiredFields = ['name', 'address', 'comments', 'rating']

        requiredFields.forEach(field => {
            const newBrewery = {
                name: 'Test new name',
                address: 'Test new address',
                comments: "Test new comments",
                rating: "4"
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newBrewery[field]
                return supertest(app)
                    .post('/api/brewery')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newBrewery)
                    .expect(400, { error: { message: `Missing '${field}' in request body` } })
            })
        })
        it(`responds with 400 and an error message when the 'rating' is invalid`, () => {
            return supertest(app)
                .post('/api/brewery')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send({
                    name: 'Test new name',
                    address: 'Test new address',
                    comments: "Test new comments",
                    rating: "8"
                })
                .expect(400, { error: { message: 'Rating must be one of 1, 2, 3, 4, 5' } })
        })
    })

    describe(`DELETE /api/brewery/:brewery_id`, () => {
        context('Given no brewery', () => {
            it('responds with 404', () => {
                const breweryId = 123456
                return supertest(app)
                    .delete(`/api/brewery/${breweryId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, { error: { message: "Brewery doesn't exist" } })
            })
        })
        context('Given there are brewery in the database', () => {
            const testBrewery = makeBreweryArray()

            beforeEach('insert brewery', () => {
                return db
                    .into('brewery')
                    .insert(testBrewery)
            })

            it('responds with 204 and removes the brewery', () => {
                const idToRemove = 2
                const expectedBrewery = testBrewery.filter(brewery => brewery.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/brewery/${idToRemove}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/brewery`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBrewery)
                    )
            })
        })

    })

    describe(`PATCH /api/brewery/:brewery_id`, () => {
        context(`Given no brewery`, () => {
            it(`responds with 404`, () => {
                const breweryId = 123456
                return supertest(app)
                    .patch(`/api/brewery/${breweryId}`)
                    .expect(404, { error: { message: `Brewery doesn't exist` } })
            })
        })
        context('Given there are brewery in the database', () => {
            const testBrewery = makeBreweryArray()
            beforeEach('insert brewery', () => {
                return db
                    .into('brewery')
                    .insert(testBrewery)
            })
            it('responds with 204 and updates the brewery', () => {
                const idToUpdate = 2
                const updateBrewery = {
                    name: 'updated brewery name',
                    comments: 'updated brewery comments',
                    rating: '3',
                    address: 'updated brewery address'
                }
                const expectedBrewery = {
                    ...testBrewery[idToUpdate - 1],
                    ...updateBrewery
                }
                return supertest(app)
                    .patch(`/api/brewery/${idToUpdate}`)
                    .send(updateBrewery)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/brewery/${idToUpdate}`)
                            .expect(expectedBrewery)
                    )
            })
            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/brewery/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, { error: { message: `Request body must contain either 'name', comments', rating' or 'address` } })
            })
            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateBrewery = {
                    name: 'updated brewery name',
                }
                const expectedBrewery = {
                    ...testBrewery[idToUpdate - 1],
                    ...updateBrewery
                }
                return supertest(app)
                    .patch(`/api/brewery/${idToUpdate}`)
                    .send({
                        ...updateBrewery,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/brewery/${idToUpdate}`)
                            .expect(expectedBrewery)
                    )
            })
        })
    }
})