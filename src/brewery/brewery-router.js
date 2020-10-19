const path = require('path')
const express = require('express')
const { v4: uuid } = require('uuid')
const xss = require('xss')
const BreweryService = require('./brewery-service')
const { Logger } = require('logger')

const breweryRouter = express.Router()
const jsonParser = express.json()
const starRating = ["1", "2", "3", "4", "5"]

const serializeBrewery = brewery => ({
    id: brewery.id,
    name: brewery.name,
    address: brewery.address,
    comments: brewery.comments,
    user_id: brewery.user_id,
})

breweryRouter
    .route('/api/brewery')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BreweryService.getAllBreweries(knexInstance)
            .then(breweries => {
                res.json(breweries.map(serializeBrewery))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name, address, comments, user_id } = req.body
        const newBrewery = { name, address, comments, user_id }

        for (const [key, value] of Object.entries(newBrewery)) {
            if (!value) {
                return res.status(400).json({ error: { message: `Missing ${key} in request body` } })
            }
        }

        newBrewery.name = name;
        newBrewery.address = address;
        newBrewery.comments = comments;
        newBrewery.user_id = user_id;

        const knexInstance = req.app.get('db')
        BreweryService.insertBrewery(knexInstance, newBrewery)
            .then(brewery => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${brewery.id}`))
                    .json(serializeBrewery(brewery))
            })
            .catch(next)
    })

breweryRouter
    .route('/:brewery_id')
    .all((req, res, next) => {
        BreweryService.getById(
            req.app.get('db'),
            req.params.brewery_id
        )
            .then(brewery => {
                if (!brewery) {
                    return res.status(404).json({ error: { message: `Brewery doesn't exist` } })
                }
                res.brewery = brewery
                next()
            })
            .catch(next)
    })
    .get((req, res) => {
        res.json(serializeBrewery(res.note))
    })
    .delete((req, res, next) => {
        const { id } = req.params;
        const knexInstance = req.app.get('db')
        BreweryService.deleteBrewery(knexInstance, id)
            .then(() => {
                Logger.info(`Brewery with id ${id} deleted.`);
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name, comments, rating, user_id } = req.body
        const breweryToUpdate = { name, comments, rating, user_id }

        const numberOfValues = Object.values(breweryToUpdate).filter(Boolean).length
        if (numberOfValues === 0)
            return res.status(400).json({ error: { message: `Request body must contain either 'name', 'rating' or 'comments' ` } })
        if (!starRating.includes(rating)) {
            return res.status(400).json({ error: { message: `Rating must be one of ${starRating.join(", ")}` } })
        }

        BreweryService.updateBrewery(
            req.app.get('db'),
            req.params.brewery_id,
            breweryToUpdate
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = breweryRouter