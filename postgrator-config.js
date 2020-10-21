require('dotenv').config();

const connectionString = (process.env.NODE_ENV === 'test')
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL

module.exports = {
    "migrationsDirectory": "migrations",
    "driver": "pg",
    "connectionString": connectionString,
    "ssl": !!process.env.SSL
}