const db = require('../config/database');

async function findAll({ includeInactive = false } = {}) {
    const where = includeInactive ? '' : 'WHERE is_active = TRUE';
    const result = await db.query(
        `SELECT * FROM products ${where} ORDER BY created_at DESC`
    );
    return result.rows;
}

async function findById(id) {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
}

async function create({ name, description, category, imageUrl, icon, saleType, startPrice, staticPrice, bidDurationSeconds, createdBy }) {
    const result = await db.query(
        `INSERT INTO products
            (name, description, category, image_url, icon, sale_type, start_price, static_price, bid_duration_seconds, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [name, description, category, imageUrl, icon, saleType, startPrice || null, staticPrice || null, bidDurationSeconds || null, createdBy]
    );
    return result.rows[0];
}

async function update(id, fields) {
    const allowed = ['name', 'description', 'category', 'image_url', 'icon', 'sale_type', 'start_price', 'static_price', 'bid_duration_seconds', 'is_active'];
    const sets = [];
    const values = [];
    let param = 1;
    for (const key of allowed) {
        if (fields[key] !== undefined) {
            sets.push(`${key} = $${param}`);
            values.push(fields[key]);
            param++;
        }
    }
    if (!sets.length) return findById(id);
    sets.push(`updated_at = NOW()`);
    values.push(id);
    const result = await db.query(
        `UPDATE products SET ${sets.join(', ')} WHERE id = $${param} RETURNING *`,
        values
    );
    return result.rows[0];
}

async function remove(id) {
    const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
}

module.exports = { findAll, findById, create, update, remove };
