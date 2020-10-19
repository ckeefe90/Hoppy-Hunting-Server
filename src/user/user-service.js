const UserService = {
    getAllUsers(knex) {
        return knex.select('*').from('user')
    },
    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('user')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    getById(knex, id) {
        return knex('user')
            .where({ id })
            .delete()
    },
    deleteUser(knex, id) {
        return knex('folders')
            .where({ id })
            .delete()
    },
    updateUser(knex, id, newUserFields) {
        return knex('user')
            .where({ id })
            .update(newUserFields)
    },
}

module.exports = UserService