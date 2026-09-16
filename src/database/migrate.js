// Runs all migration SQL files in order (simple, no schema_version bookkeeping —
// migrations are idempotent "CREATE TABLE IF NOT EXISTS" style).
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const logger = require('../utils/logger');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    for (const file of files) {
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        logger.info(`Running migration: ${file}`);
        await pool.query(sql);
    }
    logger.info('Migrations complete.');
}

if (require.main === module) {
    runMigrations()
        .then(() => process.exit(0))
        .catch((err) => {
            logger.error('Migration failed:', err.message);
            process.exit(1);
        });
}

module.exports = runMigrations;
