const path = require('path')
const express = require('express')
const xss = require('xss')
const BreweryService = require('./brewery-service')
const logger = require('../logger')

const breweryRouter = express.Router()
const jsonParser = express.json()
const starRating = ["1", "2", "3", "4", "5"]

const serializeBrewery = brewery => ({
    id: brewery.id,
    name: xss(brewery.name),
    address: xss(brewery.address),
    comments: xss(brewery.comments),
    rating: brewery.rating,
    user_id: brewery.user_id,
})

breweryRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        BreweryService.getAllBreweries(knexInstance, res.locals.user_id)
            .then(breweries => {
                res.json(breweries.map(serializeBrewery))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name, address, comments, user_id } = req.body
        const newBrewery = { name, address, comments, user_id }

        for (const [key, value] of Object.entries(newBrewery)) {
            if (res.locals.user_id && key === "user_id") continue;
            if (!value) {
                return res.status(400).json({ error: { message: `Missing '${key}' in request body` } })
            }
        }

        newBrewery.name = name;
        newBrewery.address = address;
        newBrewery.comments = comments;
        newBrewery.user_id = res.locals.user_id || user_id;

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
                const userId = res.locals.user_id
                if (userId && brewery.user_id !== userId) {
                    return res.status(403).json({ error: { message: `Access is forbidden` } })
                }
                res.brewery = brewery
                next()
            })
            .catch(next)
    })
    .get((req, res) => {
        res.json(serializeBrewery(res.brewery))
    })
    .delete((req, res, next) => {
        const { brewery_id } = req.params;
        const knexInstance = req.app.get('db')
        BreweryService.deleteBrewery(knexInstance, brewery_id)
            .then(() => {
                logger.info(`Brewery with id ${brewery_id} deleted.`);
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name, address, comments, rating } = req.body
        const breweryToUpdate = { name, address, comments, rating }

        const numberOfValues = Object.values(breweryToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({ error: { message: `Request body must contain at least one of ${Object.keys(breweryToUpdate).join(", ")}` } })
        }
        if (rating && !starRating.includes(rating)) {
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