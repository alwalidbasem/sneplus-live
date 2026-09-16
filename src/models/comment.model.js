const db = require('../config/database');

async function listBySession(liveSessionId, limit = 50) {
    const result = await db.query(
        `SELECT id, user_id, display_name, message, created_at
         FROM comments WHERE live_session_id = $1
         ORDER BY created_at DESC LIMIT $2`,
        [liveSessionId, limit]
    );
    return result.rows.reverse(); // oldest first for chat-style display
}

async function create({ liveSessionId, userId, displayName, message }) {
    const result = await db.query(
        `INSERT INTO comments (live_session_id, user_id, display_name, message)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [liveSessionId, userId, displayName, message]
    );
    return result.rows[0];
}

module.exports = { listBySession, create };
