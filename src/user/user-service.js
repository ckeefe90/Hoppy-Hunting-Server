const UserService = {
    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('users')
            .returning('*')
            .then(rows => {
                const { id } = rows[0]
                return { id }
            })
    },
    validateCredentials(knex, email, password) {
        return knex('users')
            .where({ email, password })
            .select('id')
            .first()
    }
}

module.exports = UserService