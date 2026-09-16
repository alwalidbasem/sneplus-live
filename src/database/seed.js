// Seeds demo data: admin/host/buyer users, demo products, waitlist entries and a
// scheduled live session. Uses bcrypt hashes generated at seed time.
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const logger = require('../utils/logger');

const SEEDS_DIR = path.join(__dirname, 'seeds');

async function runSeeds() {
    const file = process.argv[2] || 'demo.sql';
    const sqlPath = path.join(SEEDS_DIR, file);
    if (!fs.existsSync(sqlPath)) {
        logger.error(`Seed file not found: ${sqlPath}`);
        process.exit(1);
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');
    logger.info(`Running seed: ${file}`);
    await pool.query(sql);
    logger.info('Seed complete.');
}

if (require.main === module) {
    runSeeds()
        .then(() => process.exit(0))
        .catch((err) => {
            logger.error('Seed failed:', err.message);
            process.exit(1);
        });
}

module.exports = runSeeds;
