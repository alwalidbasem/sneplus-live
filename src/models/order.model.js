const db = require('../config/database');

async function findById(id) {
    const result = await db.query(
        `SELECT o.*, u.name AS buyer_name,
                json_agg(json_build_object(
                    'id', oi.id, 'product_id', oi.product_id, 'live_item_id', oi.live_item_id,
                    'quantity', oi.quantity, 'unit_price', oi.unit_price
                )) AS items
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.id = $1
         GROUP BY o.id, u.name`,
        [id]
    );
    return result.rows[0];
}

async function listForUser(userId) {
    const result = await db.query(
        `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return result.rows;
}

async function listAll(limit = 100) {
    const result = await db.query(
        `SELECT o.*, u.name AS buyer_name FROM orders o JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC LIMIT $1`,
        [limit]
    );
    return result.rows;
}

// Creates an order + item inside an existing transaction (client passed in).
async function createWithItem(client, { userId, liveSessionId, productId, liveItemId, unitPrice }) {
    const order = await client.query(
        `INSERT INTO orders (user_id, live_session_id, status, subtotal, total)
         VALUES ($1, $2, 'confirmed', $3, $3) RETURNING *`,
        [userId, liveSessionId, unitPrice]
    );
    await client.query(
        `INSERT INTO order_items (order_id, product_id, live_item_id, quantity, unit_price)
         VALUES ($1, $2, $3, 1, $4)`,
        [order.rows[0].id, productId, liveItemId, unitPrice]
    );
    return order.rows[0];
}

module.exports = { findById, listForUser, listAll, createWithItem };
