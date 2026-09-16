const db = require('../config/database');

async function findHighestBid(liveItemId) {
    const result = await db.query(
        `SELECT b.*, u.name AS bidder_name
         FROM bids b JOIN users u ON u.id = b.user_id
         WHERE b.live_item_id = $1
         ORDER BY b.amount DESC, b.created_at ASC
         LIMIT 1`,
        [liveItemId]
    );
    return result.rows[0];
}

async function listByItem(liveItemId, limit = 50) {
    const result = await db.query(
        `SELECT b.id, b.amount, b.created_at, u.name AS bidder_name
         FROM bids b JOIN users u ON u.id = b.user_id
         WHERE b.live_item_id = $1
         ORDER BY b.amount DESC, b.created_at ASC
         LIMIT $2`,
        [liveItemId, limit]
    );
    return result.rows;
}

async function listBySession(liveSessionId, limit = 100) {
    const result = await db.query(
        `SELECT b.id, b.amount, b.created_at, i.id AS live_item_id, p.name AS product_name, u.name AS bidder_name
         FROM bids b
         JOIN live_session_items i ON i.id = b.live_item_id
         JOIN products p ON p.id = i.product_id
         JOIN users u ON u.id = b.user_id
         WHERE b.live_session_id = $1
         ORDER BY b.created_at DESC
         LIMIT $2`,
        [liveSessionId, limit]
    );
    return result.rows;
}

async function createBid(client, { liveSessionId, liveItemId, userId, amount }) {
    const result = await client.query(
        `INSERT INTO bids (live_session_id, live_item_id, user_id, amount)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [liveSessionId, liveItemId, userId, amount]
    );
    return result.rows[0];
}

module.exports = { findHighestBid, listByItem, listBySession, createBid };
