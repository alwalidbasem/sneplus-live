const db = require('../config/database');

const PublicUser = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        avatar_url: row.avatar_url,
        is_active: row.is_active,
        created_at: row.created_at
    };
};

async function findByEmail(email) {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
}

async function findById(id) {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
}

async function create({ name, email, passwordHash, role = 'buyer' }) {
    const result = await db.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, email, passwordHash, role]
    );
    return result.rows[0];
}

module.exports = { PublicUser, findByEmail, findById, create };
