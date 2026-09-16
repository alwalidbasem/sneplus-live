const db = require('../config/database');

async function create({ name, email, country, userType, category, language }) {
    const result = await db.query(
        `INSERT INTO waitlist_entries (name, email, country, user_type, category, language)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, email, country, userType, category, language]
    );
    return result.rows[0];
}

async function existsByEmail(email) {
    const result = await db.query('SELECT 1 FROM waitlist_entries WHERE email = $1', [email]);
    return result.rows.length > 0;
}

async function list(limit = 100) {
    const result = await db.query(
        'SELECT * FROM waitlist_entries ORDER BY created_at DESC LIMIT $1',
        [limit]
    );
    return result.rows;
}

async function countByType() {
    const result = await db.query(
        `SELECT user_type, COUNT(*)::int AS count FROM waitlist_entries GROUP BY user_type`
    );
    const byType = { total: 0, buyer: 0, seller: 0, creator: 0 };
    for (const row of result.rows) {
        byType[row.user_type] = row.count;
        byType.total += row.count;
    }
    return byType;
}

async function countByColumn(column) {
    // column is only ever called with a hard-coded literal ('country' | 'category')
    const result = await db.query(
        `SELECT ${column} AS label, COUNT(*)::int AS count
         FROM waitlist_entries GROUP BY ${column} ORDER BY count DESC LIMIT 10`
    );
    return result.rows;
}

async function countLast7Days() {
    const result = await db.query(
        `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
         FROM waitlist_entries
         WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY 1 ORDER BY 1`
    );
    return result.rows;
}

module.exports = {
    create,
    existsByEmail,
    list,
    countByType,
    countByColumn,
    countLast7Days
};
