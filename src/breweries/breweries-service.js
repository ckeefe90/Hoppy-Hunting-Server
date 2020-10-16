const BreweriesService = {
    getAllBreweries(knex) {
        return knex.select('*').from('breweries')
    },
    insertBrewery(knex, newBrewery) {
        return knex
            .insert(newBrewery)
            .into('breweries')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex('breweries')
            .where({ id })
            .delete()
    },
    deleteBrewery(knex, id) {
        return knex('breweries')
            .where({ id })
            .delete()
    },
    updateBrewery(knex, id, newBreweryFields) {
        return knex('breweries')
            .where({ id })
            .update(newBreweryFields)
    },
}

module.exports = BreweryService