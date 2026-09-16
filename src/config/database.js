const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
    host: env.db.host,
    port: env.db.port,
    database: env.db.database,
    user: env.db.user,
    password: env.db.password,
    max: 20,
    idleTimeoutMillis: 30000
});

pool.on('error', (error) => {
    console.error('PostgreSQL error:', error);
});

module.exports = pool;
