const BreweryService = {
    getAllBreweries(knex, user) {
        const qb = knex.select('*').from('breweries')
        if (user) {
            qb.where('user_id', user)
        }
        return qb
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
        return knex
            .from('breweries')
            .where('id', id)
            .select('*')
            .first()
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