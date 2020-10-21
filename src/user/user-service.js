const UserService = {
    getAllUsers(knex) {
        return knex.select('*').from('users')
    },
    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('users')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex('users')
            .where({ id })
            .delete()
    },
    validateCredentials(knex, email, password) {
        return knex('users')
            .where({ email, password })
            .select('id')
            .first()
    }
}

module.exports = UserService