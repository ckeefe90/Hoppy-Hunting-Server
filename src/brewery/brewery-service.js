const BreweryService = {
    getAllBrewery(knex) {
        return knex.select('*').from('brewery')
    },
    insertBrewery(knex, newBrewery) {
        return knex
            .insert(newBrewery)
            .into('brewery')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex('brewery')
            .where({ id })
            .delete()
    },
    deleteBrewery(knex, id) {
        return knex('brewery')
            .where({ id })
            .delete()
    },
    updateBrewery(knex, id, newBreweryFields) {
        return knex('brewery')
            .where({ id })
            .update(newBreweryFields)
    },
}

module.exports = BreweryService