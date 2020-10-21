const knex = require('knex')
const app = require('./app')
const { PORT, DATABASE_URL } = require('./config')
const knexLogger = require('knex-logger')

const db = knex({
    client: 'pg',
    connection: DATABASE_URL,
})

app.set('db', db)

app.use(knexLogger(db));

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
})